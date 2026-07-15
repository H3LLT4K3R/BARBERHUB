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
      //  Llamamos a nuestra función de prueba en lugar de apiFetch
      const response = authenticateUser(form.email, form.password);

      // Simulamos un pequeño retraso de red para que se vea real (opcional)
      await new Promise(resolve => setTimeout(resolve, 800));

      if (response.success) {
        // Usamos tu misma función saveSession con los datos falsos
        saveSession({ token: response.data.token, user: response.data.user });

        //Navegamos a la ruta específica según el rol
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
    <div className="login-pagina">

      {/* Columna izquierda: imagen + overlay */}
      <div className="login-columna-izquierda">
        <div className="login-overlay" />
        <div className="login-contenido-izquierdo">

          {/* Logo de marca */}
          <BrandLogo className="login-logo-boton" imgClassName="login-logo" />

          {/* Texto hero */}
          <div className="login-texto-hero">
            <h2>
              Encuentra tu barbería ideal{" "}
              <span className="login-acento">en segundos</span>
            </h2>
            <p>
              Reserva citas, conviértete en cliente VIP y
              descubre las mejores barberías cerca de ti.
            </p>
          </div>

          {/* Footer izquierdo */}
          <div className="login-footer-izquierdo">
            © 2026 Barber Hub · Todos los derechos reservados
          </div>
        </div>
      </div>

      {/* Columna derecha: formulario */}
      <div className="login-columna-derecha">
        <div className="login-formulario-contenedor">
          <h1 className="login-titulo">¡Bienvenido!</h1>
          <p className="login-subtitulo">Inicia sesión para continuar</p>

          {/* Mensaje de éxito si la cuenta fue verificada */}
          {mensajeExito && (
            <p className="login-mensaje-exito" role="status">
              {mensajeExito}
            </p>
          )}

          {/* Formulario */}
          <form className="login-formulario" onSubmit={handleSubmit}>
            <input
              className="login-input"
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              className="login-input"
              type="password"
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
            />

            {/* Mensaje de error */}
            {error && <p className="login-error">{error}</p>}

            {/* Link recuperar contraseña */}
            <div className="login-recuperar">
              <button
                type="button"
                className="login-enlace-dorado"
                onClick={() => navigate("/recuperar-password")}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón enviar */}
            <button
              className="login-boton-enviar"
              type="submit"
              disabled={loading}
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Link registro */}
          <p className="login-registro">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              className="login-enlace-dorado"
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