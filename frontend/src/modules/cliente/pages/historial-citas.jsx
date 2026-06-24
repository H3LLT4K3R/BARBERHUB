import  { useState } from "react";
// Importación exacta con el nombre en minúsculas que me enseñaste:
import "../styles/historial-citas.css";

const citasData = [
  {
    id: 1,
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
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [citaSeleccionada, setCitaSeleccionada] = useState(citasData[0]);
  const [menuActivo, setMenuActivo] = useState("Historial");

  const citasFiltradas = citasData.filter((cita) => {
    if (filtroEstado === "Todas") return true;
    if (filtroEstado === "Canceladas") return cita.estado === "Rechazada";
    return cita.estado === filtroEstado;
  });

  const getBadgeClass = (estado) => {
    switch (estado) {
      case "Pendiente": return "estado-pendiente";
      case "Completada": return "estado-completada";
      case "Rechazada": return "estado-rechazada";
      default: return "";
    }
  };

  return (
    <div className="panel-historial">
      {/* Sidebar de navegación */}
      <aside className="sidebar-historial">
        <div className="marca-historial">
          <img src="/barberhublogo.jpg" alt="Barber Hub" className="logo-historial" />
          <h2>BARBER HUB</h2>
        </div>
        <nav className="menu-historial">
          {["Explorar", "Mis citas", "Historial", "Favoritos", "Notificaciones", "Ajustes"].map((item) => (
            <button
              key={item}
              className={`btn-menu-historial ${menuActivo === item ? "activo" : ""}`}
              onClick={() => setMenuActivo(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* Contenedor principal */}
      <div className="contenido-historial">
        <header className="encabezado-historial">
          <h1>Historial de citas</h1>
        </header>

        <div className="layout-historial">
          {/* Sección central */}
          <main className="contenido-central-historial">
            {/* Tarjetas resumen */}
            <div className="tarjetas-resumen-historial">
              <div className="tarjeta-resumen">
                <span className="numero-resumen texto-dorado">14</span>
                <span className="etiqueta-resumen">Total visitas</span>
              </div>
              <div className="tarjeta-resumen">
                <span className="numero-resumen texto-dorado">$ 1,480</span>
                <span className="etiqueta-resumen">Gastado Total</span>
              </div>
              <div className="tarjeta-resumen">
                <span className="numero-resumen">4.9</span>
                <span className="etiqueta-resumen">Calificación dada</span>
              </div>
            </div>

            {/* Filtros */}
            <div className="filtros-historial">
              {["Todas", "Completadas", "Canceladas", "Pendientes"].map((status) => (
                <button
                  key={status}
                  className={`btn-filtro-historial ${filtroEstado === status ? "activo" : ""}`}
                  onClick={() => setFiltroEstado(status)}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Lista de citas */}
            <div className="lista-citas-historial">
              {citasFiltradas.map((cita) => (
                <div key={cita.id} className="item-cita-historial">
                  <img src={cita.imagen} alt={cita.barberia} className="imagen-cita" />
                  
                  <div className="info-cita">
                    <h3>{cita.servicio} · {cita.barbero}</h3>
                    <p>{cita.barberia} · {cita.tiempo}</p>
                  </div>

                  <div className="acciones-cita">
                    <span className="precio-cita">${cita.precio}</span>
                    <span className="fecha-cita">{cita.fecha}</span>
                    <div className="fila-acciones">
                      <button 
                        className="btn-detalle-cita"
                        onClick={() => setCitaSeleccionada(cita)}
                      >
                        Ver detalle
                      </button>
                      <span className={`badge-estado ${getBadgeClass(cita.estado)}`}>
                        {cita.estado}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {citasFiltradas.length === 0 && (
                <p className="mensaje-vacio">No se encontraron citas en esta categoría.</p>
              )}
            </div>
          </main>

          {/* Sidebar derecho: detalle de cita */}
          {citaSeleccionada && (
            <aside className="sidebar-detalle">
              <div className="detalle-cita">
                <h3 className="titulo-detalle">Detalle de cita</h3>
                <p className="timestamp-detalle">{citaSeleccionada.fecha} {citaSeleccionada.hora}</p>

                {/* Info barbería */}
                <div className="tarjeta-barberia-detalle">
                  <span className="icono-tijeras">✂</span>
                  <div>
                    <h4>{citaSeleccionada.barberia}</h4>
                    <p>{citaSeleccionada.direccion}</p>
                  </div>
                </div>

                {/* Tabla de especificaciones */}
                <div className="tabla-detalle">
                  <div className="fila-detalle">
                    <span>Servicio</span>
                    <strong>{citaSeleccionada.servicio}</strong>
                  </div>
                  <div className="fila-detalle">
                    <span>Barbero</span>
                    <strong>{citaSeleccionada.barbero}</strong>
                  </div>
                  <div className="fila-detalle">
                    <span>Duración</span>
                    <strong>{citaSeleccionada.duracion}</strong>
                  </div>
                  <hr className="separador-detalle" />
                  <div className="fila-detalle">
                    <span>Total Pagado</span>
                    <strong className="texto-dorado">${citaSeleccionada.precio}</strong>
                  </div>
                  <div className="fila-detalle">
                    <span>Puntos Ganados</span>
                    <strong className="texto-dorado">{citaSeleccionada.puntosGanados}</strong>
                  </div>
                </div>

               {/* Reseña */}
     {citaSeleccionada.miCalificacion && (
      <div className="reseña-detalle">
         <h5>Mi calificación</h5>
        <p>"{citaSeleccionada.miCalificacion}"</p>
  </div>
)}

/* Botones de acción inferiores */
<div className="acciones-detalle">
  <button className="btn-reagendar">Volver a agendar</button>
  <button className="btn-ver-barberia">Ver barbería</button>
</div>
</div>
</aside>
)}
</div>
</div>
</div>
);
}
