import { useEffect } from "react";
import { X } from "lucide-react";

// Visor tipo "foto de perfil de WhatsApp": overlay oscuro con la imagen centrada y
// agrandada. Se cierra con la X, tocando fuera de la imagen, o con Escape.
export default function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    if (!src) return;
    const alEscape = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", alEscape);
    return () => window.removeEventListener("keydown", alEscape);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.86)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out",
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        style={{
          position: "absolute", top: 20, right: 20, width: 42, height: 42, borderRadius: "50%",
          background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", display: "flex",
          alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt={alt ?? "Foto"}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "90vw", maxHeight: "88vh", borderRadius: 14, objectFit: "contain", cursor: "default", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
      />
    </div>
  );
}
