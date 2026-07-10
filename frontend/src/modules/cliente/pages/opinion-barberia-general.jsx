import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/opinion-barberia-general.css";

/* Componente principal: Opinión Barbería General*/
export default function OpinionBarberiaGeneral() {
  const navigate = useNavigate();
  const [rating, setRating] = useState(5); // Estado para la calificación (estrellas)
  const [comentario, setComentario] = useState(""); // Estado para el texto del comentario
  const maxCaracteres = 1000; // Límite de caracteres del comentario

  return (
    <div className="opg-page">
      {/* Encabezado con logo */}
      <header className="opg-header">
        <img src="/logo.png" alt="Barber Hub" className="opg-logo-barberhub" />
      </header>

      <div className="opg-content">
        {/* Título principal */}
        <h1 className="opg-title">
          Valora tu experiencia
          <br />
          con nosotros
        </h1>

        {/* Tarjeta principal con formulario */}
        <div className="opg-card">
          {/* Contenedor del Logo izquierdo */}
          <div className="opg-logo-section">
            <button className="opg-logo-button">
              <img
                src="/logo-ejemplo.png"
                alt="Logo barbería"
                className="opg-barberia-logo"
              />
            </button>
          </div>

          {/* Formulario de opinión derecho */}
          <div className="opg-form">
            <div className="opg-divider" />
            <h2 className="opg-barberia-name">Urban Cuts</h2>
            <p className="opg-form-subtitle">Valora el establecimiento</p>

            {/* Estrellas de calificación */}
            <div className="opg-stars">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={`opg-star ${i < rating ? "filled" : ""}`}
                  onClick={() => setRating(i + 1)}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Área de texto para comentario */}
            <div className="opg-comment-wrapper">
              <textarea
                className="opg-comment-textarea"
                maxLength={maxCaracteres}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
              {comentario === "" && (
                <span className="opg-comment-hint">
                  Escribe tu comentario general aquí...
                  <br />
                  <small>Comparte tu experiencia en el establecimiento, servicio general, ambiente o cualquier aspecto de la barbería.</small>
                </span>
              )}
              <span className="opg-char-counter">
                {comentario.length}/{maxCaracteres}
              </span>
            </div>

            {/* Botón para enviar comentario */}
            <button className="opg-submit-btn">
              Enviar comentario a la barbería
            </button>
          </div>
        </div>

        {/* Botones de acción en el pie */}
        <div className="opg-footer-actions">
          <button className="opg-btn-back" onClick={() => navigate("/mis-citas")}>
            Regresar
          </button>
          <button
            className="opg-btn-comment-barbero"
            onClick={() => navigate("/opinion-barbero")}
          >
            Hacer comentario general al barbero
          </button>
        </div>
      </div>
    </div>
  );
}