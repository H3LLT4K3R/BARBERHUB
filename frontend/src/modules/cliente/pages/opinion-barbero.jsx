import { useState } from "react";
import "../styles/opinion-barbero.css";

const barberos = [
  { id: 1, nombre: "Alexis Duran", foto: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: 2, nombre: "Marco Pedraza", foto: "https://randomuser.me/api/portraits/men/45.jpg" },
  { id: 3, nombre: "Yahir Hernandez", foto: "https://randomuser.me/api/portraits/men/12.jpg" },
  { id: 4, nombre: "Javier Lopez", foto: "https://randomuser.me/api/portraits/men/22.jpg" },
  { id: 5, nombre: "David Rodriguez", foto: "https://randomuser.me/api/portraits/men/52.jpg" },
  { id: 6, nombre: "Juan Sanchez", foto: "https://randomuser.me/api/portraits/men/61.jpg" },
];

export default function OpinionBarbero() {
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(barberos[0]);
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
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
    }, 1200);
  };

  const handleSelectBarbero = (b) => {
    setBarberoSeleccionado(b);
    setEnviado(false); // Reinicia confirmación al cambiar de barbero
  };

  return (
    <div className="pagina-barbero">
      {/* Encabezado Superior */}
      <header className="encabezado-superior">
        <div className="contenedor-logo">
          <img src="/logo.png" alt="Barber Hub" className="logo-barberhub" />
        </div>
      </header>

      {/* Contenedor Central */}
      <main className="contenedor-central-opiniones">
        <h1 className="titulo-principal-dorado">
          Valora tu experiencia
          <br />
          con nosotros
        </h1>

        <div className="layout-dos-columnas">
          {/* columna izquierda: Selección de Barberos */}
          <section className="bloque-izquierdo-barberos">
            <h2 className="titulo-seccion-barberos">Selecciona a tu barbero</h2>

            <div className="malla-barberos">
              {barberos.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`item-barbero-btn ${barberoSeleccionado.id === b.id ? "activo" : ""}`}
                  onClick={() => handleSelectBarbero(b)}
                  aria-label={`Seleccionar a ${b.nombre}`}
                >
                  <div className="wrapper-avatar">
                    <img src={b.foto} alt={b.nombre} className="img-avatar-barbero" />
                  </div>
                  <span className="txt-nombre-barbero">{b.nombre}</span>
                </button>
              ))}
            </div>
          </section>

          {/* columna derecha: Tarjeta de Opinión */}
          <section className="tarjeta-opinion-derecha">
            <form onSubmit={handleSubmit} className="form-opinion-wrapper">
              <div className="avatar-destacado-container">
                <img
                  src={barberoSeleccionado.foto}
                  alt={barberoSeleccionado.nombre}
                  className="img-avatar-destacado"
                />
              </div>

              <h3 className="nombre-barbero-destacado">{barberoSeleccionado.nombre}</h3>
              <p className="txt-subtitulo-opinion">Tu opinión es importante</p>

              {/* Estrellas interactivas */}
              <div
                className="contenedor-estrellas-oro"
                role="radiogroup"
                aria-label="Calificación con estrellas"
              >
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const activa = hoverRating ? starIndex <= hoverRating : starIndex <= rating;
                  return (
                    <button
                      key={starIndex}
                      type="button"
                      className={`btn-estrella-star ${activa ? "marcada" : ""}`}
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

              {/* Textarea */}
              <div className="caja-textarea-wrapper">
                <textarea
                  className="input-textarea-comentario"
                  placeholder={`Escribe tu comentario aquí...\nComparte tu experiencia con ${barberoSeleccionado.nombre}.`}
                  maxLength={maxCaracteres}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  disabled={enviado}
                />
                <span className="contador-interno-caracteres">
                  {comentario.length}/{maxCaracteres}
                </span>
              </div>

              {/* Mensaje de respuesta o botón */}
              {enviado ? (
                <div className="msj-exito-opinion">
                  ✓ ¡Comentario para {barberoSeleccionado.nombre} enviado!
                </div>
              ) : (
                <button
                  type="submit"
                  className="btn-enviar-opinion-dorado"
                  disabled={enviando}
                >
                  {enviando ? "ENVIANDO..." : "ENVIAR MI COMENTARIO"}
                </button>
              )}
            </form>
          </section>
        </div>

        {/* Botón Regresar */}
        <div className="bloque-regresar-footer">
          <button type="button" className="btn-regresar-enlace">
            Regresar
          </button>
        </div>
      </main>
    </div>
  );
}