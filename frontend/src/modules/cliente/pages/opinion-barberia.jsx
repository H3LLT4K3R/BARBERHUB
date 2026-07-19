import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
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
    barberoId: "carlos-reyes",
    nombre: "Carlos Reyes",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    rating: 5,
    tiempo: "Hace 3 horas",
    fechaTimestamp: 2,
    comentario: "Carlos es un barbero increíble, siempre atento a los detalles que le pido."
  },
  {
    id: 2,
    barberoId: "juan-santos",
    nombre: "Juan Santos",
    avatar: "https://randomuser.me/api/portraits/men/60.jpg",
    rating: 3,
    tiempo: "Hace 5 días",
    fechaTimestamp: 1,
    comentario: "Buen corte aunque hubo algo de demora en el turno."
  },
];

const barberosConOpiniones = [
  { id: "carlos-reyes", nombre: "Carlos Reyes" },
  { id: "juan-santos", nombre: "Juan Santos" },
];

function Estrellas({ rating, size = "normal" }) {
  return (
    <span className={`obp-estrellas ${size}`} aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "obp-estrella llena" : "obp-estrella"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function OpinionBarberia() {
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState("barberia");
  const [filtroEstrellas, setFiltroEstrellas] = useState("todas");
  const [orden, setOrden] = useState("recientes");
  const [filtroBarbero, setFiltroBarbero] = useState("todos");

  // Filtrado y ordenamiento en tiempo real
  const opinionesFiltradas = useMemo(() => {
    const listaBase = tabActiva === "barberia" ? opinionesBarberia : opinionesBarberos;

    return listaBase
      .filter((item) => {
        const coincideEstrellas = filtroEstrellas === "todas" || item.rating === filtroEstrellas;
        const coincideBarbero = tabActiva !== "barberos" || filtroBarbero === "todos" || item.barberoId === filtroBarbero;
        return coincideEstrellas && coincideBarbero;
      })
      .sort((a, b) => {
        if (orden === "recientes") {
          return b.fechaTimestamp - a.fechaTimestamp;
        }
        return b.rating - a.rating; // Mejor valorados primero
      });
  }, [tabActiva, filtroEstrellas, filtroBarbero, orden]);

  return (
    <div className="obp-page">
      <div className="obp-main">

        {/* Encabezado */}
        <header className="obp-header">
          <button className="obp-logo-btn" type="button" aria-label="Volver al inicio">
            <img src="/logo.png" alt="Barber Hub" className="obp-logo-barberhub" />
          </button>
        </header>

        <div className="obp-content">

          {/* Nombre de la Barbería y Pestañas */}
          <div className="obp-barberia-info">
            <div className="obp-datos-block">
              <h1 className="obp-barberia-name">URBAN CUTS</h1>
              <div className="obp-rating-row">
                <Estrellas rating={5} />
                <span className="obp-total-opiniones">(220 opiniones)</span>
              </div>
              <div className="obp-barberia-address">
                <span className="obp-check-icon">✔</span>
                Blvd. 10 de mayo, Puebla
              </div>
            </div>

            <div className="obp-tabs">
              <button
                type="button"
                className={`obp-tab ${tabActiva === "barberia" ? "activo" : ""}`}
                onClick={() => { setTabActiva("barberia"); setFiltroBarbero("todos"); }}
              >
                Comentarios Barbería
              </button>
              <button
                type="button"
                className={`obp-tab ${tabActiva === "barberos" ? "activo" : ""}`}
                onClick={() => setTabActiva("barberos")}
              >
                Comentarios Barberos
              </button>
            </div>
          </div>

          {/* Filtros de opiniones */}
          <div className="obp-filters">
            <div className="obp-filters-left">
              <span className="obp-filters-label">Filtrar por:</span>
              <button
                type="button"
                className={`obp-filter ${filtroEstrellas === "todas" ? "activo" : ""}`}
                onClick={() => setFiltroEstrellas("todas")}
              >
                Todas
              </button>

              {[5, 4, 3, 2, 1].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`obp-filter-stars ${filtroEstrellas === num ? "activo" : ""}`}
                  onClick={() => setFiltroEstrellas(num)}
                  aria-label={`Filtrar ${num} estrellas`}
                >
                  <Estrellas rating={num} size="small" />
                </button>
              ))}
            </div>

            {tabActiva === "barberos" && (
              <label className="obp-barber-filter">
                <span>Barbero:</span>
                <select value={filtroBarbero} onChange={(e) => setFiltroBarbero(e.target.value)}>
                  <option value="todos">Todos los barberos</option>
                  {barberosConOpiniones.map((barbero) => (
                    <option key={barbero.id} value={barbero.id}>{barbero.nombre}</option>
                  ))}
                </select>
              </label>
            )}

            {/* Selector de ordenamiento */}
            <div className="obp-sort-container">
              <select
                className="obp-sort-select"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="recientes">Más recientes</option>
                <option value="valorados">Mejor valorados</option>
              </select>
            </div>
          </div>

          {/* Lista de opiniones */}
          <div className="obp-list">
            {opinionesFiltradas.length > 0 ? (
              opinionesFiltradas.map((op) => (
                <div key={op.id} className="obp-review-card">
                  <img src={op.avatar} alt={op.nombre} className="obp-avatar" />
                  <div className="obp-review-body">
                    <div className="obp-review-header">
                      <span className="obp-client-name">{op.nombre}</span>
                      <Estrellas rating={op.rating} size="small" />
                      <span className="obp-review-time">{op.tiempo}</span>
                    </div>
                    <p className="obp-review-text">{op.comentario}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="obp-empty-state">
                No hay opiniones registradas con {filtroEstrellas} estrellas en esta sección.
              </div>
            )}
          </div>

          {/* Botón regresar */}
          <div className="obp-actions">
            <button
              type="button"
              className="obp-btn-back"
              onClick={() => navigate("/barberia-perfil/urban-cuts")}
            >
              <IconArrowLeft size={17} aria-hidden="true" />
              Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
