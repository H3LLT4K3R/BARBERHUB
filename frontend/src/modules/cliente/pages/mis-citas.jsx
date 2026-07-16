import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconScissors,
  IconMoustache,
  IconClock,
  IconCheck,
  IconX,
  IconMessage,
  IconInfoCircle,
} from "@tabler/icons-react";
import "../styles/mis-citas.css";

/* Datos simulados del proyecto */
const citasDataIniciales = [
  {
    id: 1,
    servicio: "Corte Clásico",
    barbero: "Carlos Reyes",
    barberia: "Peluquería Black Edge",
    horario: "Mañana 11:00 am",
    precio: 80,
    badgeTexto: "Esperando respuesta - 10 min",
    badgeTipo: "esperando",
    icono: "scissors",
    pasos: [
      { id: 1, label: "Enviada", estado: "completado" },
      { id: 2, label: "Revisada", estado: "actual" },
      { id: 3, label: "Confirmada", estado: "pendiente" },
      { id: 4, label: "Completada", estado: "pendiente" },
    ],
  },
  {
    id: 2,
    servicio: "Corte + Barba",
    barbero: "Miguel González",
    barberia: "La Navaja Clásica",
    horario: "Jueves 29 de mayo a las 3:00 pm",
    precio: 120,
    badgeTexto: "Confirmada - en 3 días",
    badgeTipo: "confirmada",
    icono: "moustache",
    pasos: [
      { id: 1, label: "Enviada", estado: "completado" },
      { id: 2, label: "Aceptada", estado: "completado" },
      { id: 3, label: "Confirmada", estado: "actual" },
      { id: 4, label: "Completada", estado: "pendiente" },
    ],
  },
];

export default function MisCitas() {
  const navigate = useNavigate();
  const [citas, setCitas] = useState(citasDataIniciales);
  
  // Estados para modales de interacción
  const [citaDetalle, setCitaDetalle] = useState(null);
  const [citaCancelar, setCitaCancelar] = useState(null);
  const [citaComentario, setCitaComentario] = useState(null);
  const [comentarioTexto, setComentarioTexto] = useState("");

  // Handler para cancelar cita
  const handleConfirmarCancelacion = () => {
    if (citaCancelar) {
      setCitas(citas.filter((c) => c.id !== citaCancelar.id));
      setCitaCancelar(null);
    }
  };

  // Handler para guardar comentario
  const handleGuardarComentario = (e) => {
    e.preventDefault();
    if (comentarioTexto.trim()) {
      alert(`Comentario enviado para la cita #${citaComentario.id}`);
      setComentarioTexto("");
      setCitaComentario(null);
    }
  };

  return (
    <div className="contenido-citas">
      <div className="contenedor-citas">
        <h2 className="titulo-seccion">Mis Citas Agendadas</h2>

        {citas.length === 0 ? (
          <div className="citas-vacias">
            <IconClock size={48} stroke={1.5} color="#a0a0a0" />
            <p>No tienes citas pendientes en este momento.</p>
          </div>
        ) : (
          <div className="lista-citas">
            {citas.map((cita) => (
              <div key={cita.id} className="tarjeta-cita">
                
                {/* Bloque izquierdo: Detalles, Badge y Stepper */}
                <div className="bloque-izquierdo">
                  <div className="info-header">
                    <div className="icono-servicio">
                      {cita.icono === "moustache" ? (
                        <IconMoustache size={24} stroke={1.7} />
                      ) : (
                        <IconScissors size={24} stroke={1.7} />
                      )}
                    </div>
                    <div className="detalles-texto">
                      <h3>
                        {cita.servicio} · <span className="nombre-barbero">{cita.barbero}</span>
                      </h3>
                      <p>
                        {cita.barberia} — <strong>{cita.horario}</strong>
                      </p>
                    </div>
                  </div>

                  <div className={`badge-estado ${cita.badgeTipo}`}>
                    <span className="icono-badge">
                      {cita.badgeTipo === "confirmada" ? (
                        <IconCheck size={14} stroke={3} />
                      ) : (
                        <IconClock size={14} stroke={2.5} />
                      )}
                    </span>
                    {cita.badgeTexto}
                  </div>

                  {/* Stepper Lineal */}
                  <div className="stepper-progreso" aria-label="Progreso de la cita">
                    {cita.pasos.map((paso, idx) => (
                      <React.Fragment key={paso.id}>
                        <div className={`nodo-step ${paso.estado}`}>
                          <span className="punto-step" />
                          <span className="label-step">{paso.label}</span>
                        </div>
                        {idx < cita.pasos.length - 1 && (
                          <div
                            className={`linea-step ${
                              cita.pasos[idx + 1].estado === "completado" ||
                              cita.pasos[idx + 1].estado === "actual"
                                ? "activa"
                                : ""
                            }`}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* BLOQUE DERECHO: Cobro y Acciones */}
                <div className="bloque-derecho">
                  <div className="contenedor-precio">
                    <span className="precio-cita">${Number(cita.precio).toFixed(2)}</span>
                  </div>

                  <div className="acciones-cita">
                    <button
                      type="button"
                      className="boton-accion boton-detalles"
                      onClick={() => setCitaDetalle(cita)}
                    >
                      Ver detalles
                    </button>

                    <button
                      type="button"
                      className="boton-accion boton-cancelar"
                      onClick={() => setCitaCancelar(cita)}
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      className="boton-accion boton-comentario-gris"
                      onClick={() => navigate("/opinion-barberia-general")}
                    >
                      Hacer comentario
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* -Modal detalles */}
      {citaDetalle && (
        <div className="modal-overlay" onClick={() => setCitaDetalle(null)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de la Cita</h3>
              <button className="btn-cerrar-modal" onClick={() => setCitaDetalle(null)}>
                <IconX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Servicio:</strong> {citaDetalle.servicio}</p>
              <p><strong>Barbero:</strong> {citaDetalle.barbero}</p>
              <p><strong>Barbería:</strong> {citaDetalle.barberia}</p>
              <p><strong>Horario:</strong> {citaDetalle.horario}</p>
              <p><strong>Total a pagar:</strong> ${Number(citaDetalle.precio).toFixed(2)}</p>
              <p><strong>Estado:</strong> {citaDetalle.badgeTexto}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cerrar" onClick={() => setCitaDetalle(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -Modal cancelar */}
      {citaCancelar && (
        <div className="modal-overlay" onClick={() => setCitaCancelar(null)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>¿Cancelar cita?</h3>
              <button className="btn-cerrar-modal" onClick={() => setCitaCancelar(null)}>
                <IconX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿Estás seguro de cancelar tu cita de <strong>{citaCancelar.servicio}</strong> con{" "}
                <strong>{citaCancelar.barbero}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cerrar" onClick={() => setCitaCancelar(null)}>
                Volver
              </button>
              <button className="btn-confirmar-cancelar" onClick={handleConfirmarCancelacion}>
                Sí, cancelar cita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal comentario */}
      {citaComentario && (
        <div className="modal-overlay" onClick={() => setCitaComentario(null)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hacer un Comentario</h3>
              <button className="btn-cerrar-modal" onClick={() => setCitaComentario(null)}>
                <IconX size={20} />
              </button>
            </div>
            <form onSubmit={handleGuardarComentario}>
              <div className="modal-body">
                <p className="subtexto-modal">
                  Comentario para <strong>{citaComentario.barberia}</strong> ({citaComentario.barbero}):
                </p>
                <textarea
                  className="textarea-comentario"
                  rows="4"
                  placeholder="Escribe tus notas, especificaciones o dudas sobre tu cita..."
                  value={comentarioTexto}
                  onChange={(e) => setComentarioTexto(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cerrar"
                  onClick={() => setCitaComentario(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  Enviar Comentario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

