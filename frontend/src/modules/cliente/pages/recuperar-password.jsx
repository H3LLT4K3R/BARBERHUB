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
    <div className="rp-wrapper">

      {/* ── NAVBAR ── */}
      <nav className="rp-navbar">
        <BrandLogo className="rp-nav-logo" imgClassName="rp-logo-img" />
      </nav>

      {/* ── CONTENIDO ── */}
      <div className="rp-content">
        <div className="rp-card">

          {/* Título */}
          <h1 className="rp-title">¿Olvidaste tu contraseña?</h1>
          <p className="rp-subtitle">
            Ingresa tu correo electrónico para recuperar<br />
            su contraseña
          </p>

          {/* Formulario */}
          <form className="rp-form" onSubmit={handleSubmit}>
            <div className="rp-input-wrap">
              <div className="rp-input-icon">
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
              className="rp-btn-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar correo"}
            </button>
          </form>

          {/* Mensaje de confirmación */}
          <p className="rp-hint">
            Te enviaremos un correo para restablecer tu contraseña.{" "}
            <strong>Revisa tu correo</strong>
          </p>

          {/* Volver al login */}
          <button
            className="rp-back-btn"
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