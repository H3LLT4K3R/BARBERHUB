import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import "../styles/historial-citas.css";

const citasData = [
  {
    id: 1,
    barberiaId: "urban-cuts",
    servicio: "Corte + Barba",
    barbero: "Carlos Reyes",
    barberia: "Barbería La Reforma",
    direccion: "Av. Sor Juana 142 0.8km",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop",
    tiempo: "hace 2 días",
    fecha: "26 de mayo 2026",
    hora: "11:00 am",
    precio: 130,
    estado: "Pendiente",
    duracion: "1 Hora",
    puntosGanados: "+10 pts",
    miCalificacion: "Excelente servicio, buen corte... Carlos siempre deja todo impecable y el lugar está muy limpio"
  },
  {
    id: 2,
    barberiaId: "urban-cuts",
    servicio: "Corte Clásico",
    barbero: "Carlos Reyes",
    barberia: "Barbería La Reforma",
    direccion: "Av. Sor Juana 142 0.8km",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop",
    tiempo: "hace 1 mes",
    fecha: "25 de abril 2026",
    hora: "04:30 pm",
    precio: 100,
    estado: "Completada",
    duracion: "45 Min",
    puntosGanados: "+10 pts",
    miCalificacion: "Muy buen corte tradicional."
  },
  {
    id: 3,
    barberiaId: "la-navaja",
    servicio: "Corte Clásico",
    barbero: "Miguel G",
    barberia: "Barbería La Navaja",
    direccion: "Calle Benito Juárez 405",
    imagen: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=200&auto=format&fit=crop",
    tiempo: "hace 1 mes",
    fecha: "24 de abril 2026",
    hora: "10:00 am",
    precio: 120,
    estado: "Rechazada",
    duracion: "40 Min",
    puntosGanados: "0 pts",
    miCalificacion: ""
  }
];

export default function HistorialCitas() {
  const navigate = useNavigate();
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [citaSeleccionada, setCitaSeleccionada] = useState(citasData[0]);

  const citasFiltradas = citasData.filter((cita) => {
    if (filtroEstado === "Todas") return true;
    if (filtroEstado === "Canceladas") return cita.estado === "Rechazada";
    return cita.estado === filtroEstado;
  });

  const getBadgeClass = (estado) => {
    switch (estado) {
      case "Pendiente": return "hc-estado-pendiente";
      case "Completada": return "hc-estado-completada";
      case "Rechazada": return "hc-estado-rechazada";
      default: return "";
    }
  };

  const manejarVolverAAgendar = () => {
    if (citaSeleccionada) {
      navigate("/agenda-local", { state: { barberiaId: citaSeleccionada.barberiaId } });
    }
  };

  const manejarVerBarberia = () => {
    if (citaSeleccionada) {
      navigate(`/barberia-perfil/${citaSeleccionada.barberiaId}`);
    }
  };

  return (
    <div className="hc-contenido">
      <h1 className="hc-titulo-pagina">Historial de citas</h1>

      <div className="hc-layout">
        <main className="hc-contenido-central">
          <div className="hc-tarjetas-resumen">
            <div className="hc-tarjeta-resumen">
              <span className="hc-numero-resumen dorado">14</span>
              <span className="hc-etiqueta-resumen">Total visitas</span>
            </div>
            <div className="hc-tarjeta-resumen">
              <span className="hc-numero-resumen dorado">$ 1,480</span>
              <span className="hc-etiqueta-resumen">Gastado Total</span>
            </div>
            <div className="hc-tarjeta-resumen">
              <span className="hc-numero-resumen">4.9</span>
              <span className="hc-etiqueta-resumen">Calificación dada</span>
            </div>
          </div>

          <div className="hc-filtros">
            {["Todas", "Completadas", "Canceladas", "Pendientes"].map((status) => (
              <button
                key={status}
                className={`hc-boton-filtro ${filtroEstado === status ? "activo" : ""}`}
                onClick={() => setFiltroEstado(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="hc-lista-citas">
            {citasFiltradas.map((cita) => (
              <div key={cita.id} className="hc-item-cita">
                <img src={cita.imagen} alt={cita.barberia} className="hc-imagen-cita" />
                <div className="hc-info-cita">
                  <h3>{cita.servicio} · {cita.barbero}</h3>
                  <p>{cita.barberia} · {cita.tiempo}</p>
                </div>
                <div className="hc-acciones-cita">
                  <span className="hc-precio-cita">${cita.precio}</span>
                  <span className="hc-fecha-cita">{cita.fecha}</span>
                  <div className="hc-fila-acciones">
                    <button className="hc-boton-detalle" onClick={() => setCitaSeleccionada(cita)}>
                      Ver detalle
                    </button>
                    <span className={`hc-badge-estado ${getBadgeClass(cita.estado)}`}>
                      {cita.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {citasFiltradas.length === 0 && (
              <p className="hc-mensaje-vacio">No se encontraron citas en esta categoría.</p>
            )}
          </div>
        </main>

        {citaSeleccionada && (
          <aside className="hc-sidebar-detalle">
            <div className="hc-detalle-cita">
              <div className="hc-detalle-cita-header">
                <h3 className="hc-titulo-detalle">Detalle de cita</h3>
                <button
                  className="hc-boton-cerrar-detalle"
                  onClick={() => setCitaSeleccionada(null)}
                  aria-label="Cerrar detalle"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="hc-timestamp-detalle">{citaSeleccionada.fecha} {citaSeleccionada.hora}</p>

              <div className="hc-tarjeta-barberia-detalle">
                <span className="hc-icono-tijeras">✂</span>
                <div>
                  <h4>{citaSeleccionada.barberia}</h4>
                  <p>{citaSeleccionada.direccion}</p>
                </div>
              </div>

              <div className="hc-tabla-detalle">
                <div className="hc-fila-detalle">
                  <span>Servicio</span>
                  <strong>{citaSeleccionada.servicio}</strong>
                </div>
                <div className="hc-fila-detalle">
                  <span>Barbero</span>
                  <strong>{citaSeleccionada.barbero}</strong>
                </div>
                <div className="hc-fila-detalle">
                  <span>Duración</span>
                  <strong>{citaSeleccionada.duracion}</strong>
                </div>
                <hr className="hc-separador-detalle" />
                <div className="hc-fila-detalle">
                  <span>Total Pagado</span>
                  <strong className="dorado">${citaSeleccionada.precio}</strong>
                </div>
                <div className="hc-fila-detalle">
                  <span>Puntos Ganados</span>
                  <strong className="dorado">{citaSeleccionada.puntosGanados}</strong>
                </div>
              </div>

              {citaSeleccionada.miCalificacion && (
                <div className="hc-resena-detalle">
                  <h5>Mi calificación</h5>
                  <p>"{citaSeleccionada.miCalificacion}"</p>
                </div>
              )}

              <div className="hc-acciones-detalle">
                <button className="hc-boton-reagendar" onClick={manejarVolverAAgendar}>
                  Volver a agendar
                </button>
                <button className="hc-boton-ver-barberia" onClick={manejarVerBarberia}>
                  Ver barbería
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}