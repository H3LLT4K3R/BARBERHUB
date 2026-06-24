import { useNavigate } from "react-router-dom";
import BrandLogo from "./brand-logo";
import "../styles/app-navbar.css";

export default function AppNavbar({ showAgendaLocal = false }) {
  const navigate = useNavigate();

  return (
    <nav className="app-navbar">
      <BrandLogo
        className="app-nav-logo-btn"
        imgClassName="app-nav-logo-img"
      />

      <div className="app-nav-actions">
        {showAgendaLocal && (
          <button
            type="button"
            className="app-btn-outline"
            onClick={() => navigate("/agenda-local")}
          >
            Agenda en local
          </button>
        )}
        <button
          type="button"
          className="app-btn-outline"
          onClick={() => navigate("/explorar")}
        >
          Buscar barberías
        </button>
        <button
          type="button"
          className="app-btn-gold"
          onClick={() => navigate("/login")}
        >
          Iniciar sesión
        </button>
      </div>
    </nav>
  );
}
