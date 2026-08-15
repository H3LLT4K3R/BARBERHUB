import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconLock } from "@tabler/icons-react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../../../lib/supabase.js";
import { evaluarPassword } from "../../../utils/passwordStrength";
import PasswordStrength from "../components/password-strength";
import BrandLogo from "../components/brand-logo";
import "../styles/restablecer-password.css";

export default function RestablecerPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validando, setValidando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [error, setError] = useState("");
  const yaProcesado = useRef(false);

  // El cliente de Supabase trae detectSessionInUrl activado por defecto: puede
  // procesar el link de recuperación (tokens en el hash) por su cuenta, en paralelo
  // a este componente. Si las dos rutas leen el mismo hash y una de las dos gana la
  // carrera después de que la otra ya estableció sesión, la que llega tarde puede
  // dejar el cliente en un estado a medias — la contraseña parece actualizarse pero
  // el login después falla. Por eso este efecto captura el hash y lo BORRA de la URL
  // de inmediato, de forma síncrona, antes de cualquier await: así, sin importar en
  // qué orden corran las dos rutas, solo una de las dos encuentra tokens que procesar.
  // yaProcesado evita repetir este trabajo si el efecto corre dos veces (StrictMode
  // en desarrollo) — sin esa bandera, el segundo montaje encontraría el hash ya
  // vacío (limpiado por el primero) y caería erróneamente a "revisar si ya hay
  // sesión", dando un resultado equivocado si el navegador tenía otra sesión suelta.
  useEffect(() => {
    if (yaProcesado.current) {
      return;
    }
    yaProcesado.current = true;

    const hashCapturado = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    const params = new URLSearchParams(hashCapturado);

    async function resolverSesion() {
      // Un enlace vencido/inválido redirige con #error=... en vez de tokens.
      if (params.get("error")) return false;

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
        return !sessionError;
      }

      // Sin tokens propios en el hash: puede que detectSessionInUrl ya los haya
      // procesado antes de que este efecto corriera. Se confirma con getSession().
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    }

    resolverSesion().then((ok) => {
      if (ok) {
        setTokenValido(true);
      } else {
        setError("El enlace no es válido o ya expiró. Solicita uno nuevo desde recuperar contraseña.");
      }
      setValidando(false);
    });
  }, []);

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
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || "No fue posible actualizar la contraseña.");
      setLoading(false);
      return;
    }

    navigate("/restablecer-password-exito", { replace: true });
  };

  return (
    <div className="rpw-pagina">
      <nav className="rpw-encabezado">
        <BrandLogo className="rpw-logo-boton" imgClassName="rpw-logo" />
      </nav>

      <div className="rpw-contenido">
        <div className="rpw-tarjeta">
          <h1 className="rpw-titulo">Reestablecer contraseña</h1>
          <p className="rpw-subtitulo">
            Ingresa tu nueva contraseña para continuar
          </p>

          {validando ? (
            <p className="rpw-cargando">Validando enlace…</p>
          ) : !tokenValido ? (
            <div className="rpw-bloque-error">
              <p className="rpw-error">{error}</p>
              <button
                type="button"
                className="rpw-boton-enviar"
                onClick={() => navigate("/recuperar-password")}
              >
                Solicitar nuevo enlace
              </button>
            </div>
          ) : (
            <form className="rpw-formulario" onSubmit={handleSubmit}>
              <div className="rpw-campo">
                <div className="rpw-input-contenedor">
                  <div className="rpw-input-icono">
                    <IconLock size={20} color="#c9a227" />
                  </div>
                  <input
                    className="rpw-input"
                    type={mostrarPassword ? "text" : "password"}
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
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((v) => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", paddingRight: 14 }}
                  >
                    {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <div className="rpw-input-contenedor">
                <div className="rpw-input-icono">
                  <IconLock size={20} color="#c9a227" />
                </div>
                <input
                  className="rpw-input"
                  type={mostrarConfirm ? "text" : "password"}
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
                <button
                  type="button"
                  onClick={() => setMostrarConfirm((v) => !v)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", paddingRight: 14 }}
                >
                  {mostrarConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && <p className="rpw-error">{error}</p>}

              <button
                type="submit"
                className="rpw-boton-enviar"
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
