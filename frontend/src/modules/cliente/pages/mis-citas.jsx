import React from "react";
import "../styles/mis-citas.css";

/* Datos simulados del proyecto */
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
    pasos: [
      { id: 1, label: "Enviada", estado: "completado" },
      { id: 2, label: "Aceptada", estado: "completado" },
      { id: 3, label: "Confirmada", estado: "actual" },
      { id: 4, label: "Completada", estado: "pendiente" }
    ]
  }
];

export default function MisCitas() {
  return (
    <div className="contenido-citas">
      <div className="contenedor-citas">
        <h2 className="titulo-seccion">Pendiente de confirmación</h2>

        <div className="lista-citas">
          {citasData.map((cita) => (
            <div key={cita.id} className="tarjeta-cita">

              {/* BLOQUE IZQUIERDO: Detalles, Badge y Stepper */}
              <div className="bloque-izquierdo">
                <div className="info-header">
                  <div className="icono-servicio">
                    {cita.id === 1 ? "✂️" : "🪮"}
                  </div>
                  <div className="detalles-texto">
                    <h3>{cita.servicio} - {cita.barbero}</h3>
                    <p>{cita.barberia} - {cita.horario}</p>
                  </div>
                </div>

                <div className={`badge-estado ${cita.badgeTipo}`}>
                  <span className="icono-badge">
                    {cita.badgeTipo === "confirmada" ? "✓" : "🕒"}
                  </span>
                  {cita.badgeTexto}
                </div>

                {/* Stepper Lineal */}
                <div className="stepper-progreso">
                  {cita.pasos.map((paso, idx) => (
                    <React.Fragment key={paso.id}>
                      <div className={`nodo-step ${paso.estado}`}>
                        <span className="punto-step"></span>
                        <span className="label-step">{paso.label}</span>
                      </div>
                      {idx < cita.pasos.length - 1 && (
                        <div className={`linea-step ${
                          cita.pasos[idx + 1].estado === "completado" ||
                          cita.pasos[idx + 1].estado === "actual" ? "activa" : ""
                        }`}></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* BLOQUE DERECHO: Todo el contenido de cobro y acciones encapsulado */}
              <div className="bloque-derecho">
                <div className="contenedor-precio">
                  <span className="precio-cita">{cita.precio}</span>
                </div>

                <div className="acciones-cita">
                  <button className="boton-accion boton-detalles">
                    Ver detalles
                  </button>
                  <button className="boton-accion boton-cancelar">
                    Cancelar
                  </button>
                  <button className="boton-accion boton-comentario-gris">
                    Hacer comentario
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}