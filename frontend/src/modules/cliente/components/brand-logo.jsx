import { useNavigate } from "react-router-dom";

export default function BrandLogo({
  className = "",
  imgClassName = "",
  alt = "Barber Hub",
  interactive = true,
}) {
  const navigate = useNavigate();

  if (!interactive) {
    return (
      <span className={className}>
        <img className={imgClassName} src="/logo.png" alt={alt} />
      </span>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => navigate("/")}
      aria-label="Ir al inicio"
    >
      <img
        className={imgClassName}
        src="/logo.png"
        alt={alt}
      />
    </button>
  );
}
