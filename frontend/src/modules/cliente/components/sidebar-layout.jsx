import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, Map, Menu, X, LogOut, History, Heart, Bell, Settings, Search } from "lucide-react";
import { clearSession } from "../../../utils/api";
import "../styles/sidebar-layout.css"; // Eliminamos el import de logo.png de aquí arriba

const NAV_ITEMS = [
  { href: "/explorar", label: "Explorar", icon: Map },
  { href: "/mis-citas", label: "Mis citas", icon: CalendarDays },
  { href: "/historial", label: "Historia", icon: History },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Evaluamos si el cliente se encuentra agendando en modo local
  const esAgendaLocal = location.pathname === "/agenda-local";

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const isActive = (href) => location.pathname === href;

  return (
    <div className={`sidebar-layout ${esAgendaLocal ? "sin-sidebar-layout" : ""}`}>
      
      {/* 1. CONTROLES MÓVILES: Solo se pintan si NO es agenda local */}
      {!esAgendaLocal && (
        <>
          <button
            className="sidebar-toggle"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div
            className={`sidebar-overlay ${open ? "open" : ""}`}
            onClick={() => setOpen(false)}
          />
        </>
      )}

      {/* 2. BARRA LATERAL ASIDE: Desaparece completamente en la agenda local */}
      {!esAgendaLocal && (
        <aside className={`sidebar ${open ? "open" : ""}`}>
          <div className="sidebar-header">
            {/* CORREGIDO: src="/logo.png" directo en lugar de la variable */}
            <img 
              src="/logo.png" 
              alt="BarberHub" 
              className="sidebar-logo-img" 
              style={{ borderRadius: "50%", width: "40px", height: "40px", objectFit: "cover" }} 
            />
            <span className="sidebar-brand">BARBER HUB</span>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
                  onClick={() => {
                    navigate(item.href);
                    setOpen(false);
                  }}
                >
                  <Icon className="sidebar-link-icon" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-spacer" />

          <div className="sidebar-footer">
            <button className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={18} className="sidebar-link-icon" />
              Cerrar sesión
            </button>
          </div>
        </aside>
      )}

      {/* 3. ENVOLTORIO PRINCIPAL */}
      <div className="sidebar-main-wrapper" style={esAgendaLocal ? { marginLeft: 0, width: '100%' } : {}}>
        
        {/* CABECERA GLOBAL */}
        <header className="sidebar-global-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Si es agenda local pintamos la marca a la izquierda, si no dejamos el espacio vacío */}
          {esAgendaLocal ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '10px' }}>
              {/* CORREGIDO: src="/logo.png" directo aquí también */}
              <img 
                src="/logo.png" 
                alt="BarberHub" 
                style={{ borderRadius: "50%", width: "35px", height: "35px", objectFit: "cover" }} 
              />
              <span style={{ color: '#FFF', fontWeight: 'bold', fontSize: '18px', letterSpacing: '1px' }}>
                BARBER HUB
              </span>
            </div>
          ) : (
            <div className="sidebar-header-left-space"></div>
          )}
          
          {/* BUSCADOR: Desaparece por completo en la agenda local */}
          {!esAgendaLocal && (
            <div className="sidebar-header-search">
              <input
                type="text"
                placeholder="Buscar barberías"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sidebar-search-input"
              />
              <Search className="sidebar-search-icon" size={18} />
            </div>
          )}
        </header>

        {/* CONTENIDO INTERNO DE LAS PÁGINAS */}
        <main className="sidebar-content" style={esAgendaLocal ? { padding: '40px 24px' } : {}}>
          {children}
        </main>
      </div>
    </div>
  );
}