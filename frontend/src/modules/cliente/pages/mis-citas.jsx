import React, { useState } from "react";
import "../styles/mis-citas.css";

/* Datos de citas de prueba */
const citasData = [
  {
    id: 1,
    servicio: "Corte Clásico",
    barbero: "Carlos Reyes",
    barberia: "Peluquería Black Edge",
    horario: "Mañana 11:00 am",
    precio: "$80",
    badgeTexto: "Esperando respuesta - 10 min",
    badgeTipo: "esperando",
    pasoActual: 1,
    pasos: [
      { id: 1, label: "Enviada", estado: "completado" },
      { id: 2, label: "Revisada", estado: "actual" },
      { id: 3, label: "Confirmada", estado: "pendiente" },
      { id: 4, label: "Completada", estado: "pendiente" }
    ]
  },
  {
    id: 2,
    servicio: "Corte + Barba",
    barbero: "Miguel González",
    barberia: "La Navaja Clásica",
    horario: "Jueves 29 de mayo a las 3:00 pm",
    precio: "$120",
    badgeTexto: "Confirmada - en 3 días",
    badgeTipo: "confirmada",
    pasoActual: 3,
    pasos: [
      { id: 1, label: "Enviada", estado: "completado" },
      { id: 2, label: "Aceptada", estado: "completado" },
      { id: 3, label: "Confirmada", estado: "actual" },
      { id: 4, label: "Completada", estado: "pendiente" }
    ]
  }
];

/* Componente principal: Mis Citas */
export default function MisCitas() {
  const [menuActivo, setMenuActivo] = useState("Mis citas"); // Estado para menú lateral activo

  // Acciones de interacción
  const handleCardClick = (id) => {
    console.log(`Clic en tarjeta de cita #${id}: Abrir vista rápida.`);
  };

  const handleVerDetalles = (id, e) => {
    e.stopPropagation();
    console.log(`Abriendo detalles completos de la cita #${id}. listo para backend.`);
  };

  const handleCancelarCita = (id, e) => {
    e.stopPropagation();
    console.log(`Iniciando flujo de cancelación para la cita #${id}.`);
  };

  const handleStepClick = (citaId, pasoLabel, e) => {
    e.stopPropagation();
    console.log(`Clic en el estado "${pasoLabel}" de la cita #${citaId}.`);
  };

  return (
    <div className="pagina-citas">
      {/* Sidebar izquierdo */}
      <aside className="sidebar">
        {/* Marca Barber Hub */}
        <div className="marca">
          <img src="/barberhublogo.jpg" alt="Barber Hub" className="logo-barberhub" />
          <h2>BARBER HUB</h2>
        </div>

        {/* Menú de navegación */}
        <nav className="menu-navegacion">
          {["Explorar", "Mis citas", "Historial", "Favoritos", "Notificaciones", "Ajustes"].map((item) => (
            <button
              key={item}
              className={`boton-menu ${menuActivo === item ? "activo" : ""}`}
              onClick={() => setMenuActivo(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Perfil de usuario */}
        <div className="perfil-usuario">
          <div className="avatar-placeholder">LM</div>
          <div className="info-usuario">
            <span className="nombre-usuario">Luis Méndez</span>
          </div>
        </div>
      </aside>

      {/* Contenedor principal */}
      <div className="contenedor-principal">
        <header className="encabezado-principal">
          <h1>Mis Citas</h1>
        </header>

        <main className="contenido">
          <div className="contenedor-citas">
            
            <h2 className="titulo-seccion">Pendiente de confirmación</h2>

            {/* Lista de citas */}
            <div className="lista-citas">
              {citasData.map((cita) => (
                <div 
                  key={cita.id} 
                  className="tarjeta-cita"
                  onClick={() => handleCardClick(cita.id)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Bloque izquierdo: información y progreso */}
                  <div className="bloque-izquierdo">
                    
                    {/* Información principal */}
                    <div className="info-header">
                      <div className="icono-servicio">
                        {cita.id === 1 ? "✂️" : "🪮"}
                      </div>
                      <div className="detalles-texto">
                        <h3>{cita.servicio} - {cita.barbero}</h3>
                        <p>{cita.barberia} - {cita.horario}</p>
                      </div>
                    </div>

                    {/* Badge dinámico de estado */}
                    <div className={`badge-estado ${cita.badgeTipo}`}>
                      <span className="icono-badge">
                        {cita.badgeTipo === "confirmada" ? "✓" : "🕒"}
                      </span>
                      {cita.badgeTexto}
                    </div>

                    {/* Stepper de progreso */}
                    <div className="stepper-progreso">
                      {cita.pasos.map((paso, idx) => (
                        <React.Fragment key={paso.id}>
                          <button 
                            className={`nodo-step ${paso.estado}`}
                            onClick={(e) => handleStepClick(cita.id, paso.label, e)}
                            title={`Estado: ${paso.label}`}
                          >
                            <span className="punto-step"></span>
                            <span className="label-step">{paso.label}</span>
                          </button>
                          {idx < cita.pasos.length - 1 && (
                            <div className={`linea-step ${cita.pasos[idx + 1].estado === "completado" || cita.pasos[idx + 1].estado === "actual" ? "activa" : ""}`}></div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                  </div>

                  {/* Bloque derecho: precio y acciones */}
                  <div className="bloque-derecho">
                    <span className="precio-cita">{cita.precio}</span>
                    <div className="acciones-cita">
                      <button className="boton-accion boton-detalles" onClick={(e) => handleVerDetalles(cita.id, e)}>
                        Ver detalles
                      </button>
                      <button className="boton-accion boton-cancelar" onClick={(e) => handleCancelarCita(cita.id, e)}>
                        Cancelar
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
