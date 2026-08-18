import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
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
    desc: "Actívala cuando quieras para encontrar las barberías más cerca de ti.",
  },
  {
    num: 4,
    titulo: "Empieza a explorar",
    desc: "Agenda tu primera cita y descubre las mejores barberías de tu zona.",
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
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

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
      // Este flujo sólo crea una cuenta y perfil de cliente. No crea citas ni pagos.
      const fullName = `${form.nombre.trim()} ${form.apellido.trim()}`.trim();
      await apiFetch("/auth/registro", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          email: form.email.trim(),
          phone: form.telefono.trim(),
          password: form.password,
        }),
      });

      navigate("/login", {
        state: {
          email: form.email.trim(),
          cuentaVerificada: true,
          mensaje: "Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.",
        },
      });
    } catch (err) {
      setError(err.message || "No fue posible crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-pagina">

      {/* ── COLUMNA IZQUIERDA — negra con pasos ── */}
      <div className="reg-columna-izquierda">
        <div className="reg-columna-izquierda-contenido">

          <BrandLogo className="reg-logo-boton" imgClassName="reg-logo" />

          {/* Título sección */}
          <p className="reg-pasos-label">COMO FUNCIONA EL REGISTRO</p>

          {/* Pasos con línea conectora */}
          <div className="reg-pasos">
            {PASOS.map((paso, idx) => (
              <div className="reg-paso-item" key={paso.num}>
                <div className="reg-paso-izquierda">
                  <div className="reg-paso-circulo">{paso.num}</div>
                  {idx < PASOS.length - 1 && (
                    <div className="reg-paso-linea" />
                  )}
                </div>
                <div className="reg-paso-texto">
                  <h4>{paso.titulo}</h4>
                  <p>{paso.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── COLUMNA DERECHA — formulario ── */}
      <div className="reg-columna-derecha">
        <div className="reg-formulario-contenedor">
          <h1 className="reg-titulo">Crear cuenta</h1>

          <form className="reg-formulario" onSubmit={handleSubmit}>

            {/* Nombre / Apellido */}
            <div className="reg-fila-doble">
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
            <div className="reg-bloque-password">
              <div style={{ position: "relative" }}>
                <input
                  className="reg-input"
                  style={{ paddingRight: 40 }}
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
              <PasswordStrength password={form.password} />
            </div>

            <div style={{ position: "relative" }}>
              <input
                className="reg-input"
                style={{ paddingRight: 40 }}
                type={mostrarConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarConfirm((v) => !v)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}
              >
                {mostrarConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Error mensaje */}
            {error && <p className="reg-error">{error}</p>}

            <button
              className="reg-boton-enviar"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Registrarse"}
            </button>
          </form>

          <p className="reg-fila-login">
            ¿Ya tienes cuenta?{" "}
            <button
              type="button"
              className="reg-enlace-dorado"
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
