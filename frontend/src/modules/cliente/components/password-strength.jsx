import { evaluarPassword, REGLAS_PASSWORD } from "../../../utils/passwordStrength.js";
import "../styles/password-strength.css";

const NIVEL_LABEL = {
  debil: "Débil",
  media: "Media",
  fuerte: "Fuerte",
};

export default function PasswordStrength({ password, showRules = true }) {
  if (!password) return null;

  const { nivel, checks } = evaluarPassword(password);

  return (
    <div className="pw-strength">
      <div className="pw-strength-head">
        <span className="pw-strength-label">Seguridad:</span>
        <span className={`pw-strength-badge pw-strength-badge--${nivel}`}>
          {NIVEL_LABEL[nivel]}
        </span>
      </div>

      <div className="pw-strength-bars" aria-hidden>
        {[0, 1, 2].map((i) => {
          const barrasLlenas = { debil: 1, media: 2, fuerte: 3 };
          const activa = i < barrasLlenas[nivel];
          return (
            <span
              key={i}
              className={activa ? `pw-bar pw-bar--${nivel}` : "pw-bar pw-bar--off"}
            />
          );
        })}
      </div>

      {showRules && (
        <ul className="pw-rules">
          {REGLAS_PASSWORD.map((regla) => (
            <li
              key={regla.key}
              className={checks[regla.key] ? "pw-rule pw-rule--ok" : "pw-rule"}
            >
              {regla.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}