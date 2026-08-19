import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Store,
  Star,
  ClipboardList,
  LogOut,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { clearSession } from "../../../../utils/api.js";
import { useSuspensionGuard } from "../../../../hooks/useSuspensionGuard.js";
import { supabase } from "../../../../lib/supabase.js";
import { obtenerModulosBloqueados } from "../../../../utils/modulePermissions.js";
import "../../styles/barbero/barbero-layout.css";

// "module" liga el ítem al code de platform_modules que el dueño puede prender/apagar
// desde Seguridad de la Plataforma. Los ítems sin "module" siempre quedan visibles.
const NAV_ITEMS = [
  { href: "/barbero/inicio",      label: "Inicio",                icon: LayoutDashboard, module: null      },
  { href: "/barbero/citas",       label: "Gestión de citas",      icon: CalendarDays,    module: "agenda"  },
  { href: "/barbero/cupones",     label: "Cupones",               icon: Ticket,          module: "cupones" },
  { href: "/barbero/perfil",      label: "Perfil Barbero",        icon: Store,           module: null      },
  { href: "/barbero/opiniones",   label: "Opiniones",             icon: Star,            module: "opiniones" },
  { href: "/barbero/seguimiento", label: "Seguimiento",           icon: ClipboardList,   module: "agenda"  },
  { href: "/barbero/ajustes",    label: "Ajustes",               icon: Settings,        module: null      },
];

export default function BarberoLayout({ children, titulo = "" }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen]       = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [modulosBloqueados, setModulosBloqueados] = useState(new Set());
  const [cargandoPermisos, setCargandoPermisos] = useState(true);

  useSuspensionGuard();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    async function cargarPermisosNav() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) { setCargandoPermisos(false); return; }
      const { data: membership } = await supabase
        .from("barberia_memberships")
        .select("id, role")
        .eq("profile_id", uid)
        .eq("role", "barber")
        .eq("is_active", true)
        .maybeSingle();
      if (!membership) { setCargandoPermisos(false); return; }
      setModulosBloqueados(await obtenerModulosBloqueados(membership.id, membership.role));
      setCargandoPermisos(false);
    }
    cargarPermisosNav();
  }, []);

  const navItems = NAV_ITEMS.filter((item) => {
    if (!item.module) return true;
    return !modulosBloqueados.has(item.module);
  });

  const isActive = (href) => location.pathname.startsWith(href);

  // El filtro de arriba solo esconde el enlace del menú; sin esto, alguien con un
  // módulo bloqueado podía seguir viendo la página completa entrando por URL directa.
  const itemDeRutaActual = NAV_ITEMS.find((item) => isActive(item.href));
  const moduloBloqueado = Boolean(itemDeRutaActual?.module) && modulosBloqueados.has(itemDeRutaActual.module);

  const handleLogout = async () => {
    await clearSession();
    navigate("/login");
  };

  return (
    <div className="bl-wrapper">

      {/* OVERLAY MÓVIL */}
      {isMobile && open && (
        <div className="bl-overlay" onClick={() => setOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`bl-sidebar ${isMobile ? (open ? "open" : "closed") : ""}`}>

        {/* Logo */}
        <div className="bl-sidebar-header">
          <img src="/logo.png" alt="Barber Hub" className="bl-logo" />
          <span className="bl-brand">BARBER HUB</span>
          {isMobile && (
            <button className="bl-close-btn" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Label */}
        <div className="bl-sidebar-label">Panel Barbero</div>

        {/* Nav */}
        <nav className="bl-nav">
          {navItems.map((item) => {
            const Icon   = item.icon;
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                className={`bl-nav-item ${active ? "active" : ""}`}
                onClick={() => { navigate(item.href); setOpen(false); }}
              >
                <Icon size={18} className="bl-nav-icon" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Logout */}
        <div className="bl-sidebar-footer">
          <button className="bl-logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO DERECHO */}
      <div className="bl-main-wrapper">

        {/* NAVBAR SUPERIOR */}
        <header className="bl-navbar">
          {isMobile && (
            <button className="bl-menu-btn" onClick={() => setOpen(true)}>
              <Menu size={22} />
            </button>
          )}
          <div className="bl-navbar-left">
            {titulo && <h1 className="bl-page-title">{titulo}</h1>}
          </div>
          <div className="bl-navbar-right">
            <span className="bl-navbar-role">Barbero</span>
            <div className="bl-navbar-avatar">B</div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="bl-content">
          {cargandoPermisos ? (
            <p style={{ padding: 24, color: "#6b7280" }}>Cargando...</p>
          ) : moduloBloqueado ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: "0 0 6px" }}>No tienes acceso a este módulo</p>
              <p style={{ color: "#6b7280", margin: 0 }}>El dueño de la barbería restringió tu acceso a esta sección desde Seguridad de la Plataforma.</p>
            </div>
          ) : children}
        </main>

      </div>
    </div>
  );
}
