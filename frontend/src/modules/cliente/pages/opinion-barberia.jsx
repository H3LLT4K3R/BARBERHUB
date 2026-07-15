import { useState, useMemo } from "react";
import "../styles/opinion-barberia.css";

const opinionesBarberia = [
  {
    id: 1,
    nombre: "Alexis Duran",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    tiempo: "Hace 1 hora",
    fechaTimestamp: 3,
    comentario: "Alexis siempre me deja el corte perfecto. ¡Muy recomendado el lugar!",
  },
  {
    id: 2,
    nombre: "Marco Pedraza",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 4,
    tiempo: "Hace 2 días",
    fechaTimestamp: 2,
    comentario: "Servicio excelente, siempre quedo muy satisfecho con las instalaciones.",
  },
  {
    id: 3,
    nombre: "Yahir Hernandez",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    rating: 5,
    tiempo: "12 de mayo",
    fechaTimestamp: 1,
    comentario: "El lugar es genial y los barberos son sumamente profesionales.",
  },
];

const opinionesBarberos = [
  { 
    id: 1, 
    nombre: "Carlos Reyes", 
    avatar: "https://randomuser.me/api/portraits/men/22.jpg", 
    rating: 5, 
    tiempo: "Hace 3 horas", 
    fechaTimestamp: 2,
    comentario: "Carlos es un barbero increíble, siempre atento a los detalles que le pido." 
  },
  { 
    id: 2, 
    nombre: "Juan Santos", 
    avatar: "https://randomuser.me/api/portraits/men/60.jpg", 
    rating: 3, 
    tiempo: "Hace 5 días", 
    fechaTimestamp: 1,
    comentario: "Buen corte aunque hubo algo de demora en el turno." 
  },
];

function Estrellas({ rating, size = "normal" }) {
  return (
    <span className={`estrellas ${size}`} aria-label={`${rating} de 5 estrellas`}>
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
  const [orden, setOrden] = useState("recientes");

  // Filtrado y ordenamiento en tiempo real
  const opinionesFiltradas = useMemo(() => {
    const listaBase = tabActiva === "barberia" ? opinionesBarberia : opinionesBarberos;

    return listaBase
      .filter((item) => {
        if (filtroEstrellas === "todas") return true;
        return item.rating === filtroEstrellas;
      })
      .sort((a, b) => {
        if (orden === "recientes") {
          return b.fechaTimestamp - a.fechaTimestamp;
        }
        return b.rating - a.rating; // Mejor valorados primero
      });
  }, [tabActiva, filtroEstrellas, orden]);

  return (
    <div className="pagina-opiniones">
      <div className="contenedor-principal">
        
        {/* Encabezado */}
        <header className="encabezado">
          <button className="boton-logo" type="button" aria-label="Volver al inicio">
            <img src="/logo.png" alt="Barber Hub" className="opg-logo-barberhub" />
          </button>
        </header>

        <div className="contenido">
          
          {/* Nombre de la Barbería y Pestañas */}
          <div className="info-barberia">
            <div className="bloque-datos">
              <h1 className="nombre-barberia">URBAN CUTS</h1>
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
                type="button"
                className={`pestaña ${tabActiva === "barberia" ? "activo" : ""}`}
                onClick={() => setTabActiva("barberia")}
              >
                Comentarios Barbería
              </button>
              <button
                type="button"
                className={`pestaña ${tabActiva === "barberos" ? "activo" : ""}`}
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
                type="button"
                className={`filtro ${filtroEstrellas === "todas" ? "activo" : ""}`}
                onClick={() => setFiltroEstrellas("todas")}
              >
                Todas
              </button>

              {[5, 4, 3, 2, 1].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`filtro-estrellas ${filtroEstrellas === num ? "activo" : ""}`}
                  onClick={() => setFiltroEstrellas(num)}
                  aria-label={`Filtrar ${num} estrellas`}
                >
                  <Estrellas rating={num} size="small" />
                </button>
              ))}
            </div>

            {/* Selector de ordenamiento */}
            <div className="contenedor-ordenar">
              <select
                className="select-ordenar"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="recientes">Más recientes</option>
                <option value="valorados">Mejor valorados</option>
              </select>
            </div>
          </div>

          {/* Lista de opiniones */}
          <div className="lista-opiniones">
            {opinionesFiltradas.length > 0 ? (
              opinionesFiltradas.map((op) => (
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
              ))
            ) : (
              <div className="estado-vacio">
                No hay opiniones registradas con {filtroEstrellas} estrellas en esta sección.
              </div>
            )}
          </div>

          {/* Botón regresar */}
          <div className="acciones">
            <button type="button" className="boton-regresar">
              Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}