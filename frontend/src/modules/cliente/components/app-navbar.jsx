import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase.js";
import BrandLogo from "./brand-logo";
import "../styles/app-navbar.css";

export default function AppNavbar() {
  const navigate = useNavigate();
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelado) setAutenticado(Boolean(data.session));
    });

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <nav className="app-navbar">
      <BrandLogo
        className="app-nav-logo-btn"
        imgClassName="app-nav-logo-img"
      />

      <div className="app-nav-actions">
        <button
          type="button"
          className="app-btn-outline"
          onClick={() => navigate("/explorar")}
        >
          Buscar barberías
        </button>
        {autenticado ? (
          <button
            type="button"
            className="app-btn-gold"
            onClick={() => navigate("/mis-citas")}
          >
            Mis citas
          </button>
        ) : (
          <button
            type="button"
            className="app-btn-gold"
            onClick={() => navigate("/login")}
          >
            Iniciar sesión
          </button>
        )}
      </div>
    </nav>
  );
}
