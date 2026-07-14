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
    <div className="rpx-pagina">
      <nav className="rpx-encabezado">
        <BrandLogo className="rpx-logo-boton" imgClassName="rpx-logo" />
      </nav>

      <div className="rpx-contenido">
        <div className="rpx-icono" aria-hidden>
          <IconCheck size={40} stroke={3} color="#fff" />
        </div>

        <h1 className="rpx-titulo">Tu contraseña se ha actualizado correctamente</h1>
        <p className="rpx-subtitulo">
          En unos segundos serás redirigido al inicio de sesión.
        </p>
      </div>
    </div>
  );
}