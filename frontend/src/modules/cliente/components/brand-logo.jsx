import { useNavigate } from "react-router-dom";

export default function BrandLogo({
  className = "",
  imgClassName = "",
  alt = "Barber Hub",
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      className={className}
      onClick={() => navigate("/")}
      aria-label="Ir al inicio"
    >
      <img
        className={imgClassName}
        src="/barberhublogo.jpg"
        alt={alt}
      />
    </button>
  );
}
