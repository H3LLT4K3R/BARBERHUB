import React from "react";
import "../styles/comentario-enviado.css";

/* Componente principal: Comentario Enviado */
export default function ComentarioEnviado() {
  return (
    <div className="pagina-comentario">
      {/* Tarjeta central */}
      <div className="tarjeta-comentario">
        
        {/* Logo superior */}
        <img src="/logo-ejemplo.png" alt="Barber Hub" className="logo-comentario" />

        {/* Título principal */}
        <h1 className="titulo-comentario">¡Gracias por tu comentario!</h1>

        {/* Texto de confirmación */}
        <p className="texto-comentario">
          Tu opinión general sobre "Urban Cuts"
          <br />
          ha sido enviada con éxito.
        </p>

        {/* Botón de acción */}
        <button className="boton-aceptar">Aceptar</button>
      </div>
    </div>
  );
}