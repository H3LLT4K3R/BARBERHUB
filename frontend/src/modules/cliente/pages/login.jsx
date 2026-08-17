import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { saveSession } from "../../../utils/api.js";
import { supabase } from "../../../lib/supabase.js";
import BrandLogo from "../components/brand-logo";
import "../styles/login.css";

const ROLE_REDIRECTS = {
  owner: "/owner-finanzas",
  admin: "/owner-finanzas",
  barber: "/barbero/inicio",
  cliente: "/explorar",
};

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const rutaDestino = state?.redirigirA || state?.from;
  const [form, setForm] = useState({ email: state?.email ?? "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(state?.error ?? "");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const mensajeExito = state?.mensaje || null;

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (authError) throw authError;

      const [{ data: profile }, { data: memberships, error: membershipError }] = await Promise.all([
        supabase.from("profiles").select("full_name, is_super_admin, is_active").eq("id", data.user.id).maybeSingle(),
        supabase
          .from("barberia_memberships")
          .select("role, barberias(name, is_suspended)")
          .eq("profile_id", data.user.id)
          .eq("is_active", true),
      ]);
      if (membershipError) throw membershipError;

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        setError("Esta cuenta no está disponible. Contacta a soporte o al dueño de tu barbería si crees que se trata de un error.");
        return;
      }

      if (profile?.is_super_admin) {
        saveSession({ token: data.session.access_token, user: { id: data.user.id, email: data.user.email, nombre: profile.full_name, role: "super_admin" } });
        localStorage.setItem("token_sesion", data.session.access_token);
        navigate("/admin", { replace: true });
        return;
      }

      const membresiaSuspendida = memberships?.find((m) => m.barberias?.is_suspended);
      if (membresiaSuspendida) {
        await supabase.auth.signOut();
        setError(`La barbería "${membresiaSuspendida.barberias.name}" está temporalmente suspendida por falta de pago. Contacta a soporte para reactivarla.`);
        return;
      }

      const roles = memberships?.map((membership) => membership.role) ?? [];
      const role = roles.includes("owner")
        ? "owner"
        : roles.includes("barber")
          ? "barber"
          : roles.includes("admin")
            ? "admin"
            : "cliente";
      const user = {
        id: data.user.id,
        email: data.user.email,
        nombre: profile?.full_name || data.user.user_metadata?.full_name || data.user.email,
        role,
      };

      // Compatibilidad temporal con pantallas que aún leen la sesión local.
      saveSession({ token: data.session.access_token, user });
      localStorage.setItem("token_sesion", data.session.access_token);
      navigate(rutaDestino || ROLE_REDIRECTS[role], { replace: true });
    } catch (requestError) {
      setError(
        requestError.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : "No fue posible iniciar sesión. Revisa tus datos e inténtalo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-pagina">
      <div className="login-columna-izquierda">
        <div className="login-overlay" />
        <div className="login-contenido-izquierdo">
          <BrandLogo className="login-logo-boton" imgClassName="login-logo" />
          <div className="login-texto-hero">
            <h2>Encuentra tu barbería ideal <span className="login-acento">en segundos</span></h2>
            <p>Reserva citas, guarda tus barberías favoritas y descubre las mejores cerca de ti.</p>
          </div>
          <div className="login-footer-izquierdo">© 2026 Barber Hub · Todos los derechos reservados</div>
        </div>
      </div>

      <div className="login-columna-derecha">
        <div className="login-formulario-contenedor">
          <h1 className="login-titulo">¡Bienvenido!</h1>
          <p className="login-subtitulo">Inicia sesión para continuar</p>
          {mensajeExito && <p className="login-mensaje-exito" role="status">{mensajeExito}</p>}

          <form className="login-formulario" onSubmit={handleSubmit}>
            <input className="login-input" type="email" name="email" placeholder="Correo electrónico" value={form.email} onChange={handleChange} required />
            <div style={{ position: "relative" }}>
              <input
                className="login-input"
                style={{ paddingRight: 40, width: "100%" }}
                type={mostrarPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((v) => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}
              >
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="login-error">{error}</p>}
            <div className="login-recuperar">
              <button type="button" className="login-enlace-dorado" onClick={() => navigate("/recuperar-password")}>¿Olvidaste tu contraseña?</button>
            </div>
            <button className="login-boton-enviar" type="submit" disabled={loading}>{loading ? "Iniciando sesión..." : "Iniciar sesión"}</button>
          </form>

          <p className="login-registro">¿No tienes cuenta? <button type="button" className="login-enlace-dorado" onClick={() => navigate("/registro")}>Regístrate</button></p>
        </div>
      </div>
    </div>
  );
}
