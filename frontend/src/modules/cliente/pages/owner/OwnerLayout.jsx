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
import "../../styles/owner/owner-layout.css";

const NAV_ITEMS = [
  { href: "/perfilBarberia",    label: "Perfil Barbería",     icon: Store       },
  { href: "/owner-finanzas",    label: "Finanzas",             icon: Wallet      },
  { href: "/owner-agenda",      label: "Gestión de Agenda",    icon: CalendarDays},
  { href: "/owner-inventario",  label: "Inventario (Stock)",   icon: Package     },
  { href: "/owner-estadisticas",label: "Estadísticas",         icon: BarChart3   },
  { href: "/owner-seguridad",   label: "Seguridad",            icon: ShieldCheck },
  { href: "/owner-control",     label: "Control de Negocio",   icon: Settings2   },
  { href: "/owner-usuarios",    label: "Gestión de Usuarios",  icon: Users       },
  { href: "/owner-fidelidad",   label: "Fidelidad",            icon: Gift        },
  { href: "/owner-opiniones",   label: "Opiniones",            icon: Star        },
];

export default function OwnerLayout({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen]         = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useSuspensionGuard();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isActive = (href) => location.pathname.startsWith(href);
  const paginaActual = NAV_ITEMS.find((item) => isActive(item.href));

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
          {NAV_ITEMS.map((item) => {
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
