import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft, IconMessageCircle } from "@tabler/icons-react";
import "../styles/opinion-barberia-general.css";

export default function OpinionBarberiaGeneral() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const maxCaracteres = 1000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comentario.trim() && rating === 0) return;

    setEnviando(true);
    // Simulación de petición al backend
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
    }, 1200);
  };

  return (
    <div className="opg-page">
      {/* Encabezado */}
      <header className="opg-header">
        <img src="/logo.png" alt="Barber Hub" className="opg-logo-barberhub" />
      </header>

      <div className="opg-content">
        <h1 className="opg-title">
          Valora tu experiencia
          <br />
          con nosotros
        </h1>

        <div className="opg-card">
          {/* Logo Barbería */}
          <div className="opg-logo-section">
            <button className="opg-logo-button" type="button">
              <img
                src="/logo-ejemplo.png"
                alt="Logo URBAN CUTS"
                className="opg-barberia-logo"
              />
            </button>
          </div>

          {/* Formulario */}
          <form className="opg-form" onSubmit={handleSubmit}>
            <div className="opg-divider" />
            <h2 className="opg-barberia-name">URBAN CUTS</h2>
            <p className="opg-form-subtitle">Valora el establecimiento</p>

            {/* Selector de Estrellas con Accesibilidad */}
            <div 
              className="opg-stars" 
              role="radiogroup" 
              aria-label="Calificación con estrellas"
            >
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const activeStar = hoverRating ? starIndex <= hoverRating : starIndex <= rating;
                return (
                  <button
                    key={starIndex}
                    type="button"
                    className={`opg-star-btn ${activeStar ? "filled" : ""}`}
                    onClick={() => setRating(starIndex)}
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Calificar ${starIndex} de 5 estrellas`}
                  >
                    ★
                  </button>
                );
              })}
            </div>

            {/* Textarea con placeholder nativo y contador */}
            <div className="opg-comment-wrapper">
              <textarea
                className="opg-comment-textarea"
                maxLength={maxCaracteres}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escribe tu comentario general aquí... Comparte tu experiencia en el establecimiento, servicio, ambiente o instalaciones."
                rows={5}
                disabled={enviado}
              />
              <span className="opg-char-counter">
                {comentario.length}/{maxCaracteres}
              </span>
            </div>

            {/* Estado de envío */}
            {enviado ? (
              <div className="opg-success-msg">
                ✓ ¡Gracias! Tu opinión ha sido enviada con éxito.
              </div>
            ) : (
              <button 
                type="submit" 
                className="opg-submit-btn"
                disabled={enviando}
              >
                {enviando ? "ENVIANDO..." : "ENVIAR COMENTARIO A LA BARBERÍA"}
              </button>
            )}
          </form>
        </div>

        {/* Acciones inferiores */}
        <div className="opg-footer-actions">
          <button
            type="button"
            className="opg-btn-back"
            onClick={() => navigate("/mis-citas")}
          >
            <IconArrowLeft size={17} aria-hidden="true" />
            Regresar
          </button>
          <button
            type="button"
            className="opg-btn-comment-barbero"
            onClick={() => navigate("/opinion-barbero")}
          >
            <IconMessageCircle size={17} aria-hidden="true" />
            Comentar a un barbero
          </button>
        </div>
      </div>
    </div>
  );
}
