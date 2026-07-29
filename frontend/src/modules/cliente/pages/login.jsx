import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const [error, setError] = useState("");
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
        supabase.from("profiles").select("full_name, is_super_admin").eq("id", data.user.id).maybeSingle(),
        supabase
          .from("barberia_memberships")
          .select("role")
          .eq("profile_id", data.user.id)
          .eq("is_active", true),
      ]);
      if (membershipError) throw membershipError;

      if (profile?.is_super_admin) {
        saveSession({ token: data.session.access_token, user: { id: data.user.id, email: data.user.email, nombre: profile.full_name, role: "super_admin" } });
        localStorage.setItem("token_sesion", data.session.access_token);
        navigate("/admin", { replace: true });
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
            <p>Reserva citas, conviértete en cliente VIP y descubre las mejores barberías cerca de ti.</p>
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
            <input className="login-input" type="password" name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} required />
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
