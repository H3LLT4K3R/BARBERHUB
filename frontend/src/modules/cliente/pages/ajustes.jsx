import { useState } from "react";
import "../styles/ajustes.css";

export default function Ajustes() {
  // Estados de las opciones de configuración
  const [recordatorio, setRecordatorio] = useState(true);
  const [citaConfirmada, setCitaConfirmada] = useState(true);
  const [nuevosCupones, setNuevosCupones] = useState(false);
  const [verificacion2Pasos, setVerificacion2Pasos] = useState(true);

  // Funciones lógicas de los botones
  const handleStatClick = (statType) => {
    console.log(`Redirigiendo a detalles de: ${statType}. Conexión lista para backend.`);
  };

  const handlePasswordChange = () => {
    console.log("Abrir modal para cambiar contraseña.");
  };

  const handleDeleteAccount = () => {
    console.log("Confirmación de borrado de cuenta iniciada.");
  };

  return (
    <div className="ajt-contenido">
      <div className="ajt-grid">

        {/* Columna Izquierda: Tarjeta de Perfil y Estadísticas */}
        <div className="ajt-columna-izquierda">
          <div className="ajt-tarjeta-perfil">
            <div className="ajt-avatar">LM</div>
            <h3>Luis Méndez</h3>
            <p>luis.mendez@gmail.com</p>
          </div>

          <button className="ajt-boton-cambiar-foto">
            <span>Cambiar foto de perfil</span>
          </button>

          <div className="ajt-grid-estadisticas">
            <button className="ajt-boton-estadistica" onClick={() => handleStatClick("visitas")}>
              <strong>6</strong>
              <span>Visitas</span>
            </button>
            <button className="ajt-boton-estadistica" onClick={() => handleStatClick("puntos")}>
              <strong>50</strong>
              <span>Puntos</span>
            </button>
            <button className="ajt-boton-estadistica" onClick={() => handleStatClick("calificacion")}>
              <strong>4.8</strong>
              <span>Calificación</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha: Secciones de Configuración */}
        <div className="ajt-columna-derecha">

          {/* Sección Notificaciones */}
          <section className="ajt-seccion">
            <h2>Notificaciones</h2>

            <div className="ajt-fila-ajuste">
              <div className="ajt-etiqueta">
                <span>Recordatorio de cita</span>
              </div>
              <label className="ajt-switch">
                <input type="checkbox" checked={recordatorio} onChange={() => setRecordatorio(!recordatorio)} />
                <span className="ajt-slider"></span>
              </label>
            </div>

            <div className="ajt-fila-ajuste">
              <div className="ajt-etiqueta">
                <span>Cita confirmada</span>
              </div>
              <label className="ajt-switch">
                <input type="checkbox" checked={citaConfirmada} onChange={() => setCitaConfirmada(!citaConfirmada)} />
                <span className="ajt-slider"></span>
              </label>
            </div>

            <div className="ajt-fila-ajuste">
              <div className="ajt-etiqueta">
                <span>Nuevos cupones</span>
              </div>
              <label className="ajt-switch">
                <input type="checkbox" checked={nuevosCupones} onChange={() => setNuevosCupones(!nuevosCupones)} />
                <span className="ajt-slider"></span>
              </label>
            </div>
          </section>

          {/* Sección Seguridad */}
          <section className="ajt-seccion">
            <h2>Seguridad</h2>

            <div className="ajt-fila-ajuste">
              <div className="ajt-etiqueta">
                <span>Contraseña</span>
              </div>
              <div className="ajt-acciones-password">
                <span className="ajt-dots-password">..........</span>
                <button className="ajt-boton-editar-inline" onClick={handlePasswordChange}>Editar</button>
              </div>
            </div>

            <div className="ajt-fila-ajuste">
              <div className="ajt-etiqueta">
                <span>Verificación de 2 pasos</span>
              </div>
              <label className="ajt-switch">
                <input type="checkbox" checked={verificacion2Pasos} onChange={() => setVerificacion2Pasos(!verificacion2Pasos)} />
                <span className="ajt-slider"></span>
              </label>
            </div>
          </section>

          {/* Sección Datos Personales */}
          <section className="ajt-seccion">
            <h2>Datos personales</h2>

            <div className="ajt-fila-info">
              <div className="ajt-etiqueta">
                <span>Nombre</span>
              </div>
              <span className="ajt-valor-info">Luis Méndez</span>
            </div>

            <div className="ajt-fila-info">
              <div className="ajt-etiqueta">
                <span>Correo</span>
              </div>
              <span className="ajt-valor-info">luis.mendez@gmail.com</span>
            </div>
          </section>

          {/* Zona Peligrosa */}
          <div className="ajt-zona-eliminar">
            <span className="ajt-texto-eliminar">Eliminar cuenta</span>
            <button className="ajt-boton-eliminar" onClick={handleDeleteAccount}>Eliminar</button>
          </div>

        </div>

      </div>
    </div>
  );
}