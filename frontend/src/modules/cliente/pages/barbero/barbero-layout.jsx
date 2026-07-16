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
  X,
} from "lucide-react";
import "../../styles/barbero/barbero-layout.css";

const NAV_ITEMS = [
  { href: "/barbero/inicio",      label: "Inicio",                icon: LayoutDashboard },
  { href: "/barbero/citas",       label: "Gestión de citas",      icon: CalendarDays    },
  { href: "/barbero/cupones",     label: "Cupones",               icon: Ticket          },
  { href: "/barbero/perfil",      label: "Perfil Barbería",       icon: Store           },
  { href: "/barbero/opiniones",   label: "Opiniones",             icon: Star            },
  { href: "/barbero/seguimiento", label: "Seguimiento",           icon: ClipboardList   },
];

export default function BarberoLayout({ children, titulo = "" }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen]       = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isActive = (href) => location.pathname.startsWith(href);

  const handleLogout = () => {
    localStorage.removeItem("token");
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
          <img src="/barberhublogo.jpg" alt="Barber Hub" className="bl-logo" />
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
          {NAV_ITEMS.map((item) => {
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
          {children}
        </main>

      </div>
    </div>
  );
}