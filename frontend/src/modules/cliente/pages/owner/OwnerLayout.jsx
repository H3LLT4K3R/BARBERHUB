import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Store,
  Wallet,
  CalendarDays,
  Package,
  BarChart3,
  ShieldCheck,
  Settings2,
  Users,
  Gift,
  Star,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { clearSession } from "../../../../utils/api.js";
import { useSuspensionGuard } from "../../../../hooks/useSuspensionGuard.js";
import { supabase } from "../../../../lib/supabase.js";
import { obtenerModulosBloqueados } from "../../../../utils/modulePermissions.js";
import "../../styles/owner/owner-layout.css";

// "module" liga el ítem al code de platform_modules (ver Seguridad de la Plataforma).
// Los ítems sin "module" (Control de Negocio, Gestión de Usuarios) no son parte del
// sistema de permisos por módulo y siempre quedan visibles para cualquier admin
// activo. "Perfil Barbería" y "Seguridad" son exclusivas del dueño: ahí edita
// horarios, foto, servicios y su link de pago — un administrador no debe tocar esos
// datos del negocio.
const NAV_ITEMS = [
  { href: "/perfilBarberia",    label: "Perfil Barbería",     icon: Store,        module: null, soloOwner: true },
  { href: "/owner-finanzas",    label: "Finanzas",             icon: Wallet,       module: "finanzas"     },
  { href: "/owner-agenda",      label: "Gestión de Agenda",    icon: CalendarDays, module: "agenda"       },
  { href: "/owner-inventario",  label: "Inventario (Stock)",   icon: Package,      module: "inventario"   },
  { href: "/owner-estadisticas",label: "Estadísticas",         icon: BarChart3,    module: "estadisticas" },
  { href: "/owner-seguridad",   label: "Seguridad",            icon: ShieldCheck,  module: null, soloOwner: true },
  { href: "/owner-control",     label: "Control de Negocio",   icon: Settings2,    module: null           },
  { href: "/owner-usuarios",    label: "Gestión de Usuarios",  icon: Users,        module: null           },
  { href: "/owner-fidelidad",   label: "Fidelidad",            icon: Gift,         module: "fidelidad"    },
  { href: "/owner-opiniones",   label: "Opiniones",            icon: Star,         module: "opiniones"    },
];

export default function OwnerLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen]         = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [esOwner, setEsOwner]   = useState(true);
  const [modulosBloqueados, setModulosBloqueados] = useState(new Set());

  useSuspensionGuard();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    async function cargarPermisosNav() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return;
      const { data: membership } = await supabase
        .from("barberia_memberships")
        .select("id, role")
        .eq("profile_id", uid)
        .eq("is_active", true)
        .in("role", ["owner", "admin"])
        .maybeSingle();
      if (!membership) return;

      setEsOwner(membership.role === "owner");
      setModulosBloqueados(await obtenerModulosBloqueados(membership.id, membership.role));
    }
    cargarPermisosNav();
  }, []);

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.soloOwner) return esOwner;
    if (!item.module) return true;
    return !modulosBloqueados.has(item.module);
  });

  const isActive = (href) => location.pathname.startsWith(href);
  const paginaActual = navItems.find((item) => isActive(item.href));

  const handleLogout = async () => {
    await clearSession();
    navigate("/login");
  };

  return (
    <div className="ow-wrapper">

      {/* OVERLAY MÓVIL */}
      {isMobile && open && (
        <div className="ow-overlay" onClick={() => setOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`ow-sidebar ${isMobile ? (open ? "open" : "closed") : ""}`}>

        {/* Logo */}
        <div className="ow-sidebar-header">
          <img src="/logo.png" alt="Barber Hub" className="ow-logo" />
          <span className="ow-brand">BARBER HUB</span>
          {isMobile && (
            <button className="ow-close-btn" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Label */}
        <div className="ow-sidebar-label">Panel Owner</div>

        {/* Nav */}
        <nav className="ow-nav">
          {navItems.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                className={`ow-nav-item ${active ? "active" : ""}`}
                onClick={() => { navigate(item.href); setOpen(false); }}
              >
                <Icon size={18} className="ow-nav-icon" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Logout */}
        <div className="ow-sidebar-footer">
          <button className="ow-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO DERECHO */}
      <div className="ow-main-wrapper">

        {/* NAVBAR SUPERIOR */}
        <header className="ow-navbar">
          {isMobile && (
            <button className="ow-menu-btn" onClick={() => setOpen(true)}>
              <Menu size={22} />
            </button>
          )}
          <div className="ow-navbar-left">
            {paginaActual && <h1 className="ow-page-title">{paginaActual.label}</h1>}
          </div>
          <div className="ow-navbar-right">
            <span className="ow-navbar-role">Owner</span>
            <div className="ow-navbar-avatar">O</div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="ow-content">
          {children}
        </main>

      </div>
    </div>
  );
}
