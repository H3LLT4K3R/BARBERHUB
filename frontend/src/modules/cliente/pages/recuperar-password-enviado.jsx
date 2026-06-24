import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck } from "@tabler/icons-react";
import BrandLogo from "../components/brand-logo";
import "../styles/recuperar-password-enviado.css";

const REDIRECCION_MS = 4000;

export default function RecuperarPasswordEnviado() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, REDIRECCION_MS);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="rpe-wrapper">
      <nav className="rpe-navbar">
        <BrandLogo className="rpe-nav-logo" imgClassName="rpe-logo-img" />
      </nav>

      <div className="rpe-content">
        <div className="rpe-icon-wrap" aria-hidden>
          <IconCheck size={40} stroke={3} color="#fff" />
        </div>

        <h1 className="rpe-title">Correo enviado correctamente</h1>
        <p className="rpe-subtitle">
          En unos segundos serás redirigido al inicio de sesión.
        </p>
      </div>
    </div>
  );
}
