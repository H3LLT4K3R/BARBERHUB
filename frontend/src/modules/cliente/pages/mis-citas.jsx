import React, { useState } from "react";
import "../styles/mis-citas.css";

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

export default function MisCitas() {
  const handleCardClick = (id) => console.log(`Clic tarjeta #${id}`);
  const handleVerDetalles = (id, e) => { e.stopPropagation(); console.log(`Detalles #${id}`); };
  const handleCancelarCita = (id, e) => { e.stopPropagation(); console.log(`Cancelar #${id}`); };
  const handleHacerComentario = (id, e) => { e.stopPropagation(); console.log(`Comentario #${id}`); };
  const handleStepClick = (citaId, pasoLabel, e) => { e.stopPropagation(); console.log(`Paso ${pasoLabel}`); };

  return (
    <div className="contenedor-principal">
      <header className="encabezado-principal">
        <h1>Mis Citas</h1>
      </header>

      <main className="contenido">
        <div className="contenedor-citas">
          <h2 className="titulo-seccion">Pendiente de confirmación</h2>

          <div className="lista-citas">
            {citasData.map((cita) => (
              <div key={cita.id} className="tarjeta-cita" onClick={() => handleCardClick(cita.id)} role="button" tabIndex={0}>
                <div className="bloque-izquierdo">
                  <div className="info-header">
                    <div className="icono-servicio">{cita.id === 1 ? "✂️" : "🪮"}</div>
                    <div className="detalles-texto">
                      <h3>{cita.servicio} - {cita.barbero}</h3>
                      <p>{cita.barberia} - {cita.horario}</p>
                    </div>
                  </div>

                  <div className={`badge-estado ${cita.badgeTipo}`}>
                    <span className="icono-badge">{cita.badgeTipo === "confirmada" ? "✓" : "🕒"}</span>
                    {cita.badgeTexto}
                  </div>

                  <div className="stepper-progreso">
                    {cita.pasos.map((paso, idx) => (
                      <React.Fragment key={paso.id}>
                        <button className={`nodo-step ${paso.estado}`} onClick={(e) => handleStepClick(cita.id, paso.label, e)}>
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

                <div className="bloque-derecho">
                  <span className="precio-cita">{cita.precio}</span>
                  <div className="acciones-cita">
                    <button className="boton-accion boton-detalles" onClick={(e) => handleVerDetalles(cita.id, e)}>Ver detalles</button>
                    <button className="boton-accion boton-cancelar" onClick={(e) => handleCancelarCita(cita.id, e)}>Cancelar</button>
                    <button className="boton-accion boton-comentario" onClick={(e) => handleHacerComentario(cita.id, e)}>Hacer comentario</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}