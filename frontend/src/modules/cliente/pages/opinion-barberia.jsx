import { useState } from "react";
import "../styles/opinion-barberia.css";

/* Datos ficticios de opiniones de clientes */
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
  { id: 1, 
    nombre: "Carlos Reyes", 
    avatar: "https://randomuser.me/api/por traits/men/22.jpg", 
    rating: 5, 
    tiempo: "Hace 3 horas", 
    comentario: "Carlos es un barbero increíble, siempre atento a lo que quiero." 
  }, 
];

/*Componente para mostrar estrellas de calificación*/
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

/*Componente principal de Opiniones Barberia*/
export default function OpinionBarberia() {
  const [tabActiva, setTabActiva] = useState("barberia"); // controla pestañas
  const [filtroEstrellas, setFiltroEstrellas] = useState("todas"); // controla filtros

  return (
    <div className="pagina-opiniones">
      {/*Encabezado con logo*/}
      <header className="encabezado">
        <button className="boton-logo" onClick={() => console.log("Logo clickeado")}>
          <img src="/logo.png" alt="Barber Hub" className="logo-barberhub" />
        </button>
      </header>

      <div className="contenido">
        {/*Información principal de la barbería*/}
        <div className="info-barberia">
          <div>
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

          {/*Pestañas para cambiar entre comentarios*/}
          <div className="pestañas">
            <button
              className={`pestaña ${tabActiva === "barbería" ? "activo" : "inactivo"}`}
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

        {/*Filtros de opiniones*/}
        <div className="filtros-opiniones">
          <span className="etiqueta-filtros">Filtrar por:</span>

          <button
            className={`filtro ${filtroEstrellas === "todas" ? "activo" : ""}`}
            onClick={() => setFiltroEstrellas("todas")}  >
            Todas
          </button>

          {[5, 4, 3, 2, 1].map((num) => (
            <button
              key={num}
              className={`filtro-estrellas ${filtroEstrellas === num ? "activo" : ""}`}
              onClick={() => setFiltroEstrellas(num)} >
              <Estrellas rating={num} />
            </button>
          ))}

          <button className="boton-ordenar">
            Más recientes <span className="icono-chevron"></span>
          </button>
        </div>

        {/*Lista de opiniones*/}
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

        {/*Botón de acción, regresar*/}
        <div className="acciones">
          <button className="boton-regresar">Regresar</button>
        </div>
      </div>
    </div>
  );
}
