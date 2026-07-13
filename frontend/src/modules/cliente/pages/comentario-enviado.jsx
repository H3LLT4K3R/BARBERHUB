import React from "react";
import "../styles/comentario-enviado.css";

/* Componente principal: Comentario Enviado */
export default function ComentarioEnviado() {
  return (
    <div className="ce-pagina">
      {/* Tarjeta central */}
      <div className="ce-tarjeta">

        {/* Logo superior */}
        <img src="/logo-ejemplo.png" alt="Barber Hub" className="ce-logo" />

        {/* Título principal */}
        <h1 className="ce-titulo">¡Gracias por tu comentario!</h1>

        {/* Texto de confirmación */}
        <p className="ce-texto">
          Tu opinión general sobre "Urban Cuts"
          <br />
          ha sido enviada con éxito.
        </p>

        {/* Botón de acción */}
        <button className="ce-boton-aceptar">Aceptar</button>
      </div>
    </div>
  );
}