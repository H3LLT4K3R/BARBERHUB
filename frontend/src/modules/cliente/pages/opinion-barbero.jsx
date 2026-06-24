import { useState } from "react";
import "../styles/opinion-barbero.css";

/* Datos de barberos disponibles */
const barberos = [
  { id: 1, nombre: "Alexis Duran", foto: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: 2, nombre: "Marco Pedraza", foto: "https://randomuser.me/api/portraits/men/45.jpg" },
  { id: 3, nombre: "Yahir Hernandez", foto: "https://randomuser.me/api/portraits/men/12.jpg" },
  { id: 4, nombre: "Javier Lopez", foto: "https://randomuser.me/api/portraits/men/22.jpg" },
  { id: 5, nombre: "David Rodriguez", foto: "https://randomuser.me/api/portraits/men/52.jpg" },
  { id: 6, nombre: "Juan Sanchez", foto: "https://randomuser.me/api/portraits/men/61.jpg" },
];

/* Componente principal: Opinión Barbero */
export default function OpinionBarbero() {
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(barberos[0]); // Estado para barbero elegido
  const [rating, setRating] = useState(5); // Estado para calificación
  const [comentario, setComentario] = useState(""); // Estado para comentario
  const maxCaracteres = 1000; // Límite de caracteres

  return (
    <div className="pagina-barbero">
      {/*Encabezado con logo*/}
      <header className="encabezado">
        <img src="/logo.png" alt="Barber Hub" className="logo-barberhub" />
      </header>

      <div className="contenido">
        {/*Título principal*/}
        <h1 className="titulo-principal">
          Valora tu experiencia
          <br />
          con nosotros
        </h1>

        <div className="cuerpo">
          {/*Selección de barbero*/}
          <div className="seccion-barberos">
            <h2 className="subtitulo">Selecciona a tu barbero</h2>

            <div className="grid-barberos">
              {barberos.map((b) => (
                <button
                  key={b.id}
                  className={`tarjeta-barbero ${barberoSeleccionado.id === b.id ? "seleccionado" : ""}`}
                  onClick={() => setBarberoSeleccionado(b)}
                >
                  <img src={b.foto} alt={b.nombre} className="foto-barbero" />
                  <span className="nombre-barbero">{b.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/*Tarjeta de opinión*/}
          <div className="tarjeta-opinion">
            <img
              src={barberoSeleccionado.foto}
              alt={barberoSeleccionado.nombre}
              className="foto-opinion"
            />
            <h3 className="nombre-opinion">{barberoSeleccionado.nombre}</h3>
            <p className="subtitulo-opinion">Tu opinión es importante</p>

            {/*Estrellas de calificación*/}
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

            {/*Área de comentario*/}
            <div className="comentario-wrapper">
              <textarea
                className="comentario-textarea"
                placeholder="Escribe tu comentario aquí..."
                maxLength={maxCaracteres}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
              {comentario === "" && (
                <span className="comentario-hint">
                  Comparte tu experiencia con {barberoSeleccionado.nombre}.
                </span>
              )}
              <span className="contador-caracteres">
                {comentario.length}/{maxCaracteres}
              </span>
            </div>

            {/*Botón enviar*/}
            <button className="boton-enviar">Enviar mi comentario</button>
          </div>
        </div>

        {/*Footer con botón regresar*/}
        <div className="acciones-footer">
          <button className="boton-regresar">Regresar</button>
        </div>
      </div>
    </div>
  );
}
