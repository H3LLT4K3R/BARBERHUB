import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(barberos[0]);
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState("");
  const maxCaracteres = 1000;

  return (
    <div className="pagina-barbero">
      {/* Encabezado Superior Negro de Extremo a Extremo */}
      <header className="encabezado-superior">
        <div className="contenedor-logo">
          <img src="/logo.png" alt="Barber Hub" className="logo-barberhub" />
        </div>
      </header>

      {/* Contenedor Flotante Central */}
      <main className="contenedor-central-opiniones">
        
        <h1 className="titulo-principal-dorado">
          Valora tu experiencia
          <br />
          con nosotros
        </h1>

        <div className="layout-dos-columnas">
          
          {/* COLUMNA IZQUIERDA: Selección de Barberos */}
          <div className="bloque-izquierdo-barberos">
            <h2 className="titulo-seccion-barberos">Selecciona a tu barbero</h2>
            
            <div className="malla-barberos">
              {barberos.map((b) => (
                <button
                  key={b.id}
                  className={`item-barbero-btn ${barberoSeleccionado.id === b.id ? "activo" : ""}`}
                  onClick={() => setBarberoSeleccionado(b)}
                >
                  <div className="wrapper-avatar">
                    <img src={b.foto} alt={b.nombre} className="img-avatar-barbero" />
                  </div>
                  <span className="txt-nombre-barbero">{b.nombre}</span>
                </button>
              ))}
            </div>
          </div>

          {/* COLUMNA DERECHA: Tarjeta de Opinión Centrada */}
          <div className="tarjeta-opinion-derecha">
            <div className="avatar-destacado-container">
              <img
                src={barberoSeleccionado.foto}
                alt={barberoSeleccionado.nombre}
                className="img-avatar-destacado"
              />
            </div>
            
            <h3 className="nombre-barbero-destacado">{barberoSeleccionado.nombre}</h3>
            <p className="txt-subtitulo-opinion">Tu opinión es importante</p>

            {/* Estrellas interactiva */}
            <div className="contenedor-estrellas-oro">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={`estrella-click ${i < rating ? "marcada" : ""}`}
                  onClick={() => setRating(i + 1)}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Caja de Texto Inteligente */}
            <div className="caja-textarea-wrapper">
              <textarea
                className="input-textarea-comentario"
                placeholder={`Escribe tu comentario aquí...\nCompartte tu experiencia con ${barberoSeleccionado.nombre}.`}
                maxLength={maxCaracteres}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
              <span className="contador-interno-caracteres">
                {comentario.length}/{maxCaracteres}
              </span>
            </div>

            <button className="btn-enviar-opinion-dorado">
              Enviar mi comentario
            </button>
          </div>

        </div>

        {/* Botón Regresar centrado abajo */}
        <div className="bloque-regresar-footer">
          <button
            className="btn-regresar-enlace"
            onClick={() => navigate("/opinion-barberia-general")}
          >
            Regresar
          </button>
        </div>

      </main>
    </div>
  );
}