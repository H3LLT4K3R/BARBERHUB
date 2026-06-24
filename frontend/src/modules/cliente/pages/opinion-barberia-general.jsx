import React, { useState } from "react";
import "../styles/opinion-barberia-general.css";

/* Componente principal: Opinión Barbería General*/
export default function OpinionBarberiaGeneral() {
  const [rating, setRating] = useState(5); // Estado para la calificación (estrellas)
  const [comentario, setComentario] = useState(""); // Estado para el texto del comentario
  const maxCaracteres = 1000; // Límite de caracteres del comentario

  return (
    <div className="pagina-opinion">
      {/* Encabezado con logo */}
      <header className="encabezado">
        <img src="/logo.png" alt="Barber Hub" className="logo-barberhub" />
      </header>

      <div className="contenido">
        {/* Título principal */}
        <h1 className="titulo-principal">
          Valora tu experiencia
          <br />
          con nosotros
        </h1>

        {/* Tarjeta principal con formulario */}
        <div className="tarjeta-opinion">
          {/* Logo de la barbería como botón */}
          <button className="boton-logo-barberia">
            <img
              src="/logo-ejemplo.png"
              alt="Logo barbería"
              className="logo-barberia"
            />
          </button>

          {/* Formulario de opinión */}
          <div className="formulario-opinion">
            <div className="linea-separadora" />
            <h2 className="nombre-barberia">Urban Cuts</h2>
            <p className="subtitulo-formulario">Valora el establecimiento</p>

            {/* Estrellas de calificación */}
            <div className="estrellas-calificacion">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={`estrella ${i < rating ? "llena" : ""}`}
                  onClick={() => setRating(i + 1)}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Área de texto para comentario */}
            <div className="comentario-wrapper">
              <textarea
                className="comentario-textarea"
                placeholder="Escribe tu comentario general aquí..."
                maxLength={maxCaracteres}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
              {comentario === "" && (
                <span className="comentario-hint">
                  Comparte tu experiencia en el establecimiento, servicio general,
                  ambiente o cualquier aspecto de la barbería.
                </span>
              )}
              <span className="contador-caracteres">
                {comentario.length}/{maxCaracteres}
              </span>
            </div>

            {/* Botón para enviar comentario */}
            <button className="boton-enviar">
              Enviar comentario a la barbería
            </button>
          </div>
        </div>

        {/* Botones de acción en el pie */}
        <div className="acciones-footer">
          <button className="boton-regresar">Regresar</button>
          <button className="boton-comentario-barbero">
            Hacer comentario general al barbero
          </button>
        </div>
      </div>
    </div>
  );
}
