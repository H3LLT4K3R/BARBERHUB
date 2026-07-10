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
    <div className="contenido-ajustes">
      <div className="ajustes-grid">

        {/* Columna Izquierda: Tarjeta de Perfil y Estadísticas */}
        <div className="columna-izquierda-ajustes">
          <div className="tarjeta-perfil">
            <div className="avatar-perfil">LM</div>
            <h3>Luis Méndez</h3>
            <p>luis.mendez@gmail.com</p>
          </div>

          <button className="boton-cambiar-foto">
            <span>Cambiar foto de perfil</span>
          </button>

          <div className="grid-estadisticas">
            <button className="boton-estadistica" onClick={() => handleStatClick("visitas")}>
              <strong>6</strong>
              <span>Visitas</span>
            </button>
            <button className="boton-estadistica" onClick={() => handleStatClick("puntos")}>
              <strong>50</strong>
              <span>Puntos</span>
            </button>
            <button className="boton-estadistica" onClick={() => handleStatClick("calificacion")}>
              <strong>4.8</strong>
              <span>Calificación</span>
            </button>
          </div>
        </div>

        {/* Columna Derecha: Secciones de Configuración */}
        <div className="columna-derecha-ajustes">

          {/* Sección Notificaciones */}
          <section className="seccion-ajustes">
            <h2>Notificaciones</h2>

            <div className="fila-ajuste">
              <div className="etiqueta-ajuste">
                <span>Recordatorio de cita</span>
              </div>
              <label className="switch-ajuste">
                <input type="checkbox" checked={recordatorio} onChange={() => setRecordatorio(!recordatorio)} />
                <span className="slider-ajuste"></span>
              </label>
            </div>

            <div className="fila-ajuste">
              <div className="etiqueta-ajuste">
                <span>Cita confirmada</span>
              </div>
              <label className="switch-ajuste">
                <input type="checkbox" checked={citaConfirmada} onChange={() => setCitaConfirmada(!citaConfirmada)} />
                <span className="slider-ajuste"></span>
              </label>
            </div>

            <div className="fila-ajuste">
              <div className="etiqueta-ajuste">
                <span>Nuevos cupones</span>
              </div>
              <label className="switch-ajuste">
                <input type="checkbox" checked={nuevosCupones} onChange={() => setNuevosCupones(!nuevosCupones)} />
                <span className="slider-ajuste"></span>
              </label>
            </div>
          </section>

          {/* Sección Seguridad */}
          <section className="seccion-ajustes">
            <h2>Seguridad</h2>

            <div className="fila-ajuste">
              <div className="etiqueta-ajuste">
                <span>Contraseña</span>
              </div>
              <div className="acciones-password">
                <span className="dots-password">..........</span>
                <button className="boton-editar-inline" onClick={handlePasswordChange}>Editar</button>
              </div>
            </div>

            <div className="fila-ajuste">
              <div className="etiqueta-ajuste">
                <span>Verificación de 2 pasos</span>
              </div>
              <label className="switch-ajuste">
                <input type="checkbox" checked={verificacion2Pasos} onChange={() => setVerificacion2Pasos(!verificacion2Pasos)} />
                <span className="slider-ajuste"></span>
              </label>
            </div>
          </section>

          {/* Sección Datos Personales */}
          <section className="seccion-ajustes">
            <h2>Datos personales</h2>

            <div className="fila-info">
              <div className="etiqueta-ajuste">
                <span>Nombre</span>
              </div>
              <span className="valor-info">Luis Méndez</span>
            </div>

            <div className="fila-info">
              <div className="etiqueta-ajuste">
                <span>Correo</span>
              </div>
              <span className="valor-info">luis.mendez@gmail.com</span>
            </div>
          </section>

          {/* Zona Peligrosa */}
          <div className="zona-eliminar">
            <span className="texto-eliminar">Eliminar cuenta</span>
            <button className="boton-eliminar" onClick={handleDeleteAccount}>Eliminar</button>
          </div>

        </div>

      </div>
    </div>
  );
}