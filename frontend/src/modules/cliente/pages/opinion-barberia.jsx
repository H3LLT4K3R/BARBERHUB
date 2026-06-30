import { useState } from "react";
import "../styles/opinion-barberia.css";

const opinionesBarberia = [
  {
    id: 1,
    nombre: "Alexis Duran",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    tiempo: "Hace 1 hora",
    comentario: "Alexis siempre me deja el corte perfecto. ¡Muy recomendado el lugar!",
  },
  {
    id: 2,
    nombre: "Marco Pedraza",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 4,
    tiempo: "Hace 2 días",
    comentario: "Servicio excelente, siempre quedo muy satisfecho.",
  },
  {
    id: 3,
    nombre: "Yahir Hernandez",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    rating: 5,
    tiempo: "12 de mayo",
    comentario: "El lugar es genial y los barberos profesionales.",
  },
];

const opinionesBarberos = [
  { 
    id: 1, 
    nombre: "Carlos Reyes", 
    avatar: "https://randomuser.me/api/portraits/men/22.jpg", 
    rating: 5, 
    tiempo: "Hace 3 horas", 
    comentario: "Carlos es un barbero increíble, siempre atento a lo que quiero." 
  }, 
];

function Estrellas({ rating, size = "normal" }) {
  return (
    <span className={`estrellas ${size}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "estrella llena" : "estrella"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function OpinionBarberia() {
  const [tabActiva, setTabActiva] = useState("barberia");
  const [filtroEstrellas, setFiltroEstrellas] = useState("todas");

  return (
    <div className="pagina-opiniones">
      {/* SECCIÓN 1: CONTENEDOR PRINCIPAL DERECHO */}
      <div className="contenedor-principal">
        
        {/* Encabezado con logo */}
        <header className="encabezado">
          <button className="boton-logo" onClick={() => console.log("Logo clickeado")}>
            <img src="/logo.png" alt="Barber Hub" className="logo-barberhub" />
          </button>
        </header>

        {/* Contenido en flujo vertical */}
        <div className="contenido">
          
          {/* Nombre de la Barbería y Pestañas en la misma fila */}
          <div className="info-barberia">
            <div className="bloque-datos">
              <h1 className="nombre-barberia">Urban Cuts</h1>
              <div className="fila-rating">
                <Estrellas rating={5} />
                <span className="total-opiniones">(220 opiniones)</span>
              </div>
              <div className="direccion-barberia">
                <span className="icono-check">✔</span>
                Blvd. 10 de mayo, Puebla
              </div>
            </div>

            <div className="pestañas">
              <button
                className={`pestaña ${tabActiva === "barberia" ? "activo" : "inactivo"}`}
                onClick={() => setTabActiva("barberia")}
              >
                Comentarios Barbería
              </button>
              <button
                className={`pestaña ${tabActiva === "barberos" ? "activo" : "inactivo"}`}
                onClick={() => setTabActiva("barberos")}
              >
                Comentarios Barberos
              </button>
            </div>
          </div>

          {/* Filtros de opiniones */}
          <div className="filtros-opiniones">
            <div className="grupo-filtros-izq">
              <span className="etiqueta-filtros">Filtrar por:</span>
              <button
                className={`filtro ${filtroEstrellas === "todas" ? "activo" : ""}`}
                onClick={() => setFiltroEstrellas("todas")}
              >
                Todas
              </button>

              {[5, 4, 3, 2, 1].map((num) => (
                <button
                  key={num}
                  className={`filtro-estrellas ${filtroEstrellas === num ? "activo" : ""}`}
                  onClick={() => setFiltroEstrellas(num)}
                >
                  <Estrellas rating={num} size="small" />
                </button>
              ))}
            </div>

            <button className="boton-ordenar">
              Más recientes <span className="icono-chevron">&gt;</span>
            </button>
          </div>

          {/* Lista de opiniones limpias */}
          <div className="lista-opiniones">
            {(tabActiva === "barberia" ? opinionesBarberia : opinionesBarberos).map((op) => (
              <div key={op.id} className="tarjeta-opinion">
                <img src={op.avatar} alt={op.nombre} className="avatar-cliente" />
                <div className="cuerpo-opinion">
                  <div className="encabezado-opinion">
                    <span className="nombre-cliente">{op.nombre}</span>
                    <Estrellas rating={op.rating} size="small" />
                    <span className="tiempo-opinion">{op.tiempo}</span>
                  </div>
                  <p className="texto-opinion">{op.comentario}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Botón regresar abajo a la derecha */}
          <div className="acciones">
            <button className="boton-regresar">Regresar</button>
          </div>
        </div>
      </div>
    </div>
  );
}