import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, Map, Menu, X, LogOut, History, Heart, Bell, Settings, User, Search } from "lucide-react";
import { clearSession } from "../../../utils/api";
import "../styles/sidebar-layout.css"; // Lo mantenemos por si tienes tipografías u otros estilos menores

const NAV_ITEMS = [
  { href: "/explorar", label: "Explorar", icon: Map },
  { href: "/mis-citas", label: "Mis citas", icon: CalendarDays },
  { href: "/historial-citas", label: "Historial", icon: History },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Detectamos si es pantalla móvil para hacer el menú responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const esAgendaLocal = location.pathname === "/agenda-local";
  const esExplorar = location.pathname === "/explorar";
  const esAjustes = location.pathname === "/ajustes";

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const isActive = (href) => location.pathname === href;

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "#f9fafb" }}>
      
      {/* 1. OVERLAY OSCURO PARA MÓVILES (cuando el menú está abierto) */}
      {!esAgendaLocal && isMobile && open && (
        <div 
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 40 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* 2. BARRA LATERAL (Negra, sin espacios blancos) */}
      {!esAgendaLocal && (
        <aside 
          style={{ 
            width: "250px",
            height: "100vh", 
            backgroundColor: "#000000", // Forzamos el fondo negro
            display: "flex", 
            flexDirection: "column",
            position: isMobile ? "fixed" : "static", // Se sobrepone en móviles
            left: isMobile ? (open ? 0 : "-250px") : 0,
            top: 0,
            zIndex: 50,
            transition: "left 0.3s ease",
            borderRight: "1px solid #1f2937"
          }}
        >
          {/* Logo del Menú */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0", gap: "12px", borderBottom: "1px solid #1f2937" }}>
            <img src="/logo.png" alt="BarberHub" style={{ width: "40px", height: "40px" }} />
            <span style={{ color: "#ffffff", fontWeight: "bold", fontSize: "18px" }}>BARBER HUB</span>
          </div>

          {/* Botones de Navegación */}
          <nav style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => { navigate(item.href); setOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px 16px",
                    backgroundColor: active ? "#D4AF37" : "transparent", // Dorado si está activo
                    color: active ? "#000000" : "#9ca3af",
                    border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "15px", fontWeight: active ? "600" : "500",
                    transition: "all 0.2s ease", textAlign: "left"
                  }}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Botón Cerrar Sesión */}
          <div style={{ padding: "20px 16px", borderTop: "1px solid #1f2937" }}>
            <button 
              onClick={handleLogout}
              style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px 16px", backgroundColor: "transparent", color: "#9ca3af", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: "500" }}
            >
              <LogOut size={20} />
              Cerrar sesión
            </button>
          </div>
        </aside>
      )}

      {/* 3. ENVOLTORIO DERECHO (CABECERA + CONTENIDO) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        
        {/* CABECERA GLOBAL NEGRA */}
        <header 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            width: "100%", 
            height: "70px", 
            backgroundColor: "#000000",
            padding: "0 24px",
            flexShrink: 0
          }}
        >
          {/* Izquierda del Header (Botón hamburguesa en móviles) */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {!esAgendaLocal && isMobile && (
              <button 
                onClick={() => setOpen(true)} 
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
              >
                <Menu size={24} />
              </button>
            )}
            
            {esAgendaLocal && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img src="/logo.png" alt="BarberHub" style={{ height: "40px" }} />
                <span style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>BARBER HUB</span>
              </div>
            )}
          </div>

          {/* Derecha del Header (El buscador responsivo) */}
          {!esAgendaLocal && !esAjustes && (
            esExplorar ? (
              <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  backgroundColor: "#ffffff", 
                  borderRadius: "9999px", 
                  padding: "8px 16px",
                  width: "100%", 
                  maxWidth: isMobile ? "220px" : "350px", // Se hace más pequeño en celulares
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  marginLeft: "16px"
                }}
              >
                <input
                  type="text"
                  placeholder="Buscar barberías"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: "none", outline: "none", backgroundColor: "transparent", flex: 1, fontSize: "14px", color: "#333333", width: "100%" }}
                />
                <Search style={{ color: "#6b7280", marginLeft: "8px", cursor: "pointer", flexShrink: 0 }} size={18} />
              </div>
            ) : (
              <button onClick={() => navigate("/ajustes")} style={{ color: "white", background: "transparent", border: "none", cursor: "pointer", display: "flex" }}>
                <User size={24} />
              </button>
            )
          )}
        </header>

        {/* 4. CONTENIDO PRINCIPAL DONDE SE CARGAN TUS VISTAS */}
        <main style={{ flex: 1, overflowY: "auto", position: "relative", backgroundColor: "#f9fafb", padding: isMobile ? "16px" : "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
