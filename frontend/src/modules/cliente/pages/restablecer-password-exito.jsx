import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconCheck } from "@tabler/icons-react";
import BrandLogo from "../components/brand-logo";
import "../styles/restablecer-password-exito.css";

const REDIRECCION_MS = 4000;

export default function RestablecerPasswordExito() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login", {
        replace: true,
        state: {
          cuentaVerificada: true,
          mensaje: "Contraseña actualizada. Ya puedes iniciar sesión.",
        },
      });
    }, REDIRECCION_MS);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="rpx-wrapper">
      <nav className="rpx-navbar">
        <BrandLogo className="rpx-nav-logo" imgClassName="rpx-logo-img" />
      </nav>

      <div className="rpx-content">
        <div className="rpx-icon-wrap" aria-hidden>
          <IconCheck size={40} stroke={3} color="#fff" />
        </div>

        <h1 className="rpx-title">Tu contraseña se ha actualizado correctamente</h1>
        <p className="rpx-subtitle">
          En unos segundos serás redirigido al inicio de sesión.
        </p>
      </div>
    </div>
  );
}
