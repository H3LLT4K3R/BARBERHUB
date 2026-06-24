import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../utils/api.js";
import { evaluarPassword } from "../../../utils/passwordStrength.js";
import PasswordStrength from "../components/password-strength";
import BrandLogo from "../components/brand-logo";
import "../styles/registro.css";

// Pasos del registro con línea conectora
const PASOS = [
  {
    num: 1,
    titulo: "Crea tu cuenta",
    desc: "Nombre, correo y contraseña. Listo en menos de 2 minutos.",
  },
  {
    num: 2,
    titulo: "Verifica tu correo",
    desc: "Te enviamos un código para confirmar tu identidad.",
  },
  {
    num: 3,
    titulo: "Permite tu ubicación",
    desc: "Para mostrarte barberías en tu radio de 5 km.",
  },
  {
    num: 4,
    titulo: "Empieza a explorar",
    desc: "Agenda tu primera cita y conviértete en cliente VIP.",
  },
];

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const { valida } = evaluarPassword(form.password);
    if (!valida) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, una letra, un número y un símbolo.",
      );
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/registro", {
        method: "POST",
        body: JSON.stringify(form),
      });
      navigate("/verificar-correo", {
        state: { email: form.email.trim() },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-wrapper">

      {/* ── COLUMNA IZQUIERDA — negra con pasos ── */}
      <div className="reg-left">
        <div className="reg-left-content">

          <BrandLogo className="reg-logo" imgClassName="reg-logo-img" />

          {/* Título sección */}
          <p className="reg-steps-label">COMO FUNCIONA EL REGISTRO</p>

          {/* Pasos con línea conectora */}
          <div className="reg-steps">
            {PASOS.map((paso, idx) => (
              <div className="reg-step-item" key={paso.num}>
                <div className="reg-step-left">
                  <div className="reg-step-circle">{paso.num}</div>
                  {idx < PASOS.length - 1 && (
                    <div className="reg-step-line" />
                  )}
                </div>
                <div className="reg-step-text">
                  <h4>{paso.titulo}</h4>
                  <p>{paso.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── COLUMNA DERECHA — formulario ── */}
      <div className="reg-right">
        <div className="reg-form-wrap">
          <h1 className="reg-title">Crear cuenta</h1>

          <form className="reg-form" onSubmit={handleSubmit}>

            {/* Nombre / Apellido */}
            <div className="reg-row-2">
              <input
                className="reg-input"
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
              <input
                className="reg-input"
                type="text"
                name="apellido"
                placeholder="Apellido"
                value={form.apellido}
                onChange={handleChange}
                required
              />
            </div>

            {/* Correo */}
            <input
              className="reg-input"
              type="email"
              name="email"
              placeholder="Correo Electrónico"
              value={form.email}
              onChange={handleChange}
              required
            />

            {/* Teléfono */}
            <input
              className="reg-input"
              type="tel"
              name="telefono"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={handleChange}
              required
            />

            {/* Contraseña */}
            <div className="reg-password-block">
              <input
                className="reg-input"
                type="password"
                name="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={handleChange}
                required
              />
              <PasswordStrength password={form.password} />
            </div>

            <input
              className="reg-input"
              type="password"
              name="confirmPassword"
              placeholder="Confirmar contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            {/* Error mensaje */}
            {error && <p className="reg-error">{error}</p>}

            <button
              className="reg-btn-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Registrarse"}
            </button>
          </form>

          <p className="reg-login-row">
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              className="reg-link-gold"
              onClick={() => navigate("/login")}
            >
              Inicia Sesión
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}