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
    <div className="rpe-pagina">
      <nav className="rpe-encabezado">
        <BrandLogo className="rpe-logo-boton" imgClassName="rpe-logo" />
      </nav>

      <div className="rpe-contenido">
        <div className="rpe-icono" aria-hidden>
          <IconCheck size={40} stroke={3} color="#fff" />
        </div>

        <h1 className="rpe-titulo">Correo enviado correctamente</h1>
        <p className="rpe-subtitulo">
          En unos segundos serás redirigido al inicio de sesión.
        </p>
      </div>
    </div>
  );
}