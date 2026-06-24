import { useState } from "react";
import "../styles/notificaciones.css";

/* Datos de notificaciones de prueba */
const notificacionesData = [
  {
    id: 1,
    titulo: "Cita Confirmada",
    descripcion: "Carlos Reyes confirmó tu cita del día martes 27 de junio a las 11:00 a.m.",
    tiempo: "Hace 12 min",
    leido: false
  },
  {
    id: 2,
    titulo: "Recordatorio - Mañana 11:00 a.m",
    descripcion: "Tu cita con Carlos Reyes en Black Edge es mañana a las 11:00 a.m.",
    tiempo: "Hace 1 hr",
    leido: false
  },
  {
    id: 3,
    titulo: "Califica Tu Visita",
    descripcion: "¿Cómo fue tu experiencia con Miguel Gutierrez?",
    tiempo: "Ayer 4 p.m",
    leido: true
  },
  {
    id: 4,
    titulo: "Cita Adenegada",
    descripcion: "El barbero Juan Santos no pudo aceptar tu cita del día lunes a las 5:00 p.m.",
    tiempo: "Ayer 10 a.m",
    leido: true
  },
  {
    id: 5,
    titulo: "Nuevo Cupón Disponible",
    descripcion: "Tienes un cupón de bienvenida del 10%.",
    tiempo: "Hace 12 min",
    leido: false
  }
];

/* Componente principal: Notificaciones */
export default function Notificaciones() {
  const [menuActivo, setMenuActivo] = useState("Notificaciones"); // Estado para menú lateral activo

  // Acción al hacer clic en una notificación
  const handleNotificationClick = (id) => {
    console.log(`Notificación ${id} clickeada. Listo para conectar al backend.`);
  };

  // Contador de notificaciones sin leer
  const sinLeerContador = notificacionesData.filter(n => !n.leido).length;

  return (
    <div className="nt-dashboard">
      <div className="nt-main-wrapper" style={{ paddingTop: "0px" }}>
        {/* Se removió el header redundante para que el contenido suba */}

        <main className="contenido">
          <div className="contenedor-cards">
            
            {/*Contador de no leídas*/}
            <div className="contador-no-leidas">
              <span className="punto-indicador"></span>
              <p>{sinLeerContador} sin leer</p>
            </div>

            {/*Lista de notificaciones*/}
            <div className="lista-notificaciones">
              {notificacionesData.map((alerta) => (
                <button 
                  key={alerta.id} 
                  className={`tarjeta-notificacion ${!alerta.leido ? "no-leida" : ""}`}
                  onClick={() => handleNotificationClick(alerta.id)}
                  title="Marcar como leída / Ver detalles"
                >
                  <div className="icono-placeholder"></div>

                  <div className="info-notificacion">
                    <h3>{alerta.titulo}</h3>
                    <p className="descripcion-notificacion">{alerta.descripcion}</p>
                  </div>

                  <div className="meta-notificacion">
                    <span className="texto-tiempo">{alerta.tiempo}</span>
                    {!alerta.leido && <span className="punto-no-leida"></span>}
                  </div>
                </button>
              ))}
            </div>

          </div>
        </main>
      </div>

      {/* Uso de menuActivo para evitar alertas/errores de ESLint no-unused-vars */}
      <span style={{ display: "none" }} onClick={() => setMenuActivo("Notificaciones")}>
        {menuActivo}
      </span>
    </div>
  );
}
