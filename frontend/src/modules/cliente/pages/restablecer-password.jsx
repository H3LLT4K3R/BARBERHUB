import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IconLock } from "@tabler/icons-react";
import { apiFetch } from "../../../utils/api";
import { evaluarPassword } from "../../../utils/passwordStrength";
import PasswordStrength from "../components/password-strength";
import BrandLogo from "../components/brand-logo";
import "../styles/restablecer-password.css";

export default function RestablecerPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validando, setValidando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setValidando(false);
      setError("El enlace no es válido. Solicita uno nuevo desde recuperar contraseña.");
      return;
    }

    apiFetch(`/auth/validar-reset-token?token=${encodeURIComponent(token)}`)
      .then(() => {
        setTokenValido(true);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setValidando(false);
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const { valida } = evaluarPassword(password);
    if (!valida) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, una letra, un número y un símbolo.",
      );
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/restablecer-password", {
        method: "POST",
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      navigate("/restablecer-password-exito", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rpw-wrapper">
      <nav className="rpw-navbar">
        <BrandLogo className="rpw-nav-logo" imgClassName="rpw-logo-img" />
      </nav>

      <div className="rpw-content">
        <div className="rpw-card">
          <h1 className="rpw-title">Reestablecer contraseña</h1>
          <p className="rpw-subtitle">
            Ingresa tu nueva contraseña para continuar
          </p>

          {validando ? (
            <p className="rpw-loading">Validando enlace…</p>
          ) : !tokenValido ? (
            <div className="rpw-error-block">
              <p className="rpw-error">{error}</p>
              <button
                type="button"
                className="rpw-btn-submit"
                onClick={() => navigate("/recuperar-password")}
              >
                Solicitar nuevo enlace
              </button>
            </div>
          ) : (
            <form className="rpw-form" onSubmit={handleSubmit}>
              <div className="rpw-field">
                <div className="rpw-input-wrap">
                  <div className="rpw-input-icon">
                    <IconLock size={20} color="#c9a227" />
                  </div>
                  <input
                    className="rpw-input"
                    type="password"
                    name="password"
                    placeholder="Nueva contraseña"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <PasswordStrength password={password} />
              </div>

              <div className="rpw-input-wrap">
                <div className="rpw-input-icon">
                  <IconLock size={20} color="#c9a227" />
                </div>
                <input
                  className="rpw-input"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="rpw-error">{error}</p>}

              <button
                type="submit"
                className="rpw-btn-submit"
                disabled={loading}
              >
                {loading ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
