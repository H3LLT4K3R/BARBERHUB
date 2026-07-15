import { useState } from "react";
import "../styles/notificaciones.css";

// Datos iniciales de notificaciones con tipo de alerta asignado
const datosIniciales = [
  {
    id: 1,
    tipo: "confirmada",
    titulo: "Cita Confirmada",
    descripcion: "Carlos Reyes confirmó tu cita del día martes 27 de junio a las 11:00 a.m.",
    tiempo: "Hace 12 min",
    leido: false
  },
  {
    id: 2,
    tipo: "recordatorio",
    titulo: "Recordatorio - Mañana 11:00 a.m",
    descripcion: "Tu cita con Carlos Reyes en Black Edge es mañana a las 11:00 a.m.",
    tiempo: "Hace 1 hr",
    leido: false
  },
  {
    id: 3,
    tipo: "calificacion",
    titulo: "Califica Tu Visita",
    descripcion: "¿Cómo fue tu experiencia con Miguel Gutierrez?",
    tiempo: "Ayer 4 p.m",
    leido: true
  },
  {
    id: 4,
    tipo: "denegada",
    titulo: "Cita Denegada",
    descripcion: "El barbero Juan Santos no pudo aceptar tu cita del día lunes a las 5:00 p.m.",
    tiempo: "Ayer 10 a.m",
    leido: true
  },
  {
    id: 5,
    tipo: "cupon",
    titulo: "Nuevo Cupón Disponible",
    descripcion: "Tienes un cupón de bienvenida del 10%.",
    tiempo: "Hace 12 min",
    leido: false
  }
];

// Helper para renderizar iconos según el tipo de notificación
const renderIcono = (tipo) => {
  switch (tipo) {
    case "confirmada":
    case "recordatorio":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "calificacion":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "denegada":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case "cupon":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
  }
};

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState(datosIniciales);

  // Marcar notificación como leída al hacer clic
  const handleNotificationClick = (id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
    );
  };

  // Marcar todas como leídas
  const handleMarcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
  };

  const sinLeerContador = notificaciones.filter((n) => !n.leido).length;

  return (
    <div className="nt-dashboard">
      <div className="nt-main-wrapper">
        <main className="contenido">
          <div className="contenedor-cards">
            
            {/* Cabecera del área de notificaciones */}
            <div className="cabecera-notificaciones">
              <div className="contador-no-leidas">
                <span className="punto-indicador" />
                <p>{sinLeerContador} sin leer</p>
              </div>

              {sinLeerContador > 0 && (
                <button 
                  className="boton-limpiar" 
                  onClick={handleMarcarTodasLeidas}
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Lista de notificaciones */}
            <div className="lista-notificaciones">
              {notificaciones.map((alerta) => (
                <button
                  key={alerta.id}
                  className={`tarjeta-notificacion ${!alerta.leido ? "no-leida" : ""}`}
                  onClick={() => handleNotificationClick(alerta.id)}
                  aria-label={`Notificación: ${alerta.titulo}`}
                >
                  <div className={`icono-contenedor ${alerta.tipo}`}>
                    {renderIcono(alerta.tipo)}
                  </div>

                  <div className="info-notificacion">
                    <h3>{alerta.titulo}</h3>
                    <p className="descripcion-notificacion">{alerta.descripcion}</p>
                  </div>

                  <div className="meta-notificacion">
                    <span className="texto-tiempo">{alerta.tiempo}</span>
                    {!alerta.leido && <span className="punto-no-leida" />}
                  </div>
                </button>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}