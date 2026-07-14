import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconMail, IconArrowLeft } from "@tabler/icons-react";
import { apiFetch } from "../../../utils/api";
import BrandLogo from "../components/brand-logo";
import "../styles/recuperar-password.css";

export default function RecuperarPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiFetch("/auth/recuperar-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      navigate("/recuperar-password-enviado", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-pagina">

      {/* ── ENCABEZADO ── */}
      <nav className="rp-encabezado">
        <BrandLogo className="rp-logo-boton" imgClassName="rp-logo" />
      </nav>

      {/* ── CONTENIDO ── */}
      <div className="rp-contenido">
        <div className="rp-tarjeta">

          {/* Título */}
          <h1 className="rp-titulo">¿Olvidaste tu contraseña?</h1>
          <p className="rp-subtitulo">
            Ingresa tu correo electrónico para recuperar<br />
            su contraseña
          </p>

          {/* Formulario */}
          <form className="rp-formulario" onSubmit={handleSubmit}>
            <div className="rp-input-contenedor">
              <div className="rp-input-icono">
                <IconMail size={22} color="#c9a227" />
              </div>
              <input
                className="rp-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && <p className="rp-error">{error}</p>}

            <button
              className="rp-boton-enviar"
              type="submit"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar correo"}
            </button>
          </form>

          {/* Mensaje de confirmación */}
          <p className="rp-texto-ayuda">
            Te enviaremos un correo para restablecer tu contraseña.{" "}
            <strong>Revisa tu correo</strong>
          </p>

          {/* Volver al login */}
          <button
            className="rp-boton-volver"
            type="button"
            onClick={() => navigate("/login")}
          >
            <IconArrowLeft size={15} />
            Volver al inicio de sesión
          </button>

        </div>
      </div>

    </div>
  );
}