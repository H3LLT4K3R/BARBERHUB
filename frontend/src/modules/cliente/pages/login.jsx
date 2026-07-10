import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { saveSession } from "../../../utils/api.js"; // Quitamos apiFetch temporalmente
import { authenticateUser } from "../data/mockAuth.js"; // <-- NUESTRO MOCK
import BrandLogo from "../components/brand-logo";
import "../styles/login.css";

/* Componente principal: Login*/
export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Estado del formulario
  const [form, setForm] = useState({
    email: state?.email ?? "",
    password: "",
  });

  // Estados auxiliares
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mensajeExito = state?.cuentaVerificada ? state.mensaje : null;

  // Manejo de cambios en inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // Manejo de envío de formulario (MODIFICADO PARA USAR EL MOCK)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // 1. Llamamos a nuestra función de prueba en lugar de apiFetch
      const response = authenticateUser(form.email, form.password);

      // Simulamos un pequeño retraso de red para que se vea real (opcional)
      await new Promise(resolve => setTimeout(resolve, 800));

      if (response.success) {
        // 2. Usamos tu misma función saveSession con los datos falsos
        saveSession({ token: response.data.token, user: response.data.user });
        
        // 3. Navegamos a la ruta específica según el rol
        navigate(response.redirect);
      } else {
        // Mostramos el error si escriben mal la clave
        setError(response.error);
      }
    } catch (err) {
      setError("Ocurrió un error inesperado al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pagina-login">

      {/* Columna izquierda: imagen + overlay */}
      <div className="login-columna-izquierda">
        <div className="overlay-login" />
        <div className="contenido-izquierdo">

          {/* Logo de marca */}
          <BrandLogo className="logo-login" imgClassName="logo-login-img" />

          {/* Texto hero */}
          <div className="texto-hero-login">
            <h2>
              Encuentra tu barbería ideal{" "}
              <span className="acento-login">en segundos</span>
            </h2>
            <p>
              Reserva citas, conviértete en cliente VIP y
              descubre las mejores barberías cerca de ti.
            </p>
          </div>

          {/* Footer izquierdo */}
          <div className="footer-izquierdo">
            © 2026 Barber Hub · Todos los derechos reservados
          </div>
        </div>
      </div>

      {/* Columna derecha: formulario */}
      <div className="login-columna-derecha">
        <div className="formulario-login">
          <h1 className="titulo-login">¡Bienvenido!</h1>
          <p className="subtitulo-login">Inicia sesión para continuar</p>

          {/* Mensaje de éxito si la cuenta fue verificada */}
          {mensajeExito && (
            <p className="mensaje-exito-login" role="status">
              {mensajeExito}
            </p>
          )}

          {/* Formulario */}
          <form className="form-login" onSubmit={handleSubmit}>
            <input
              className="input-login"
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              className="input-login"
              type="password"
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
            />

            {/* Mensaje de error */}
            {error && <p className="error-login">{error}</p>}

            {/* Link recuperar contraseña */}
            <div className="recuperar-login">
              <button
                type="button"
                className="link-dorado-login"
                onClick={() => navigate("/recuperar-password")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón enviar */}
            <button
              className="btn-submit-login"
              type="submit"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Link registro */}
          <p className="registro-login">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              className="link-dorado-login"
              onClick={() => navigate("/registro")}
            >
              Regístrate
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}