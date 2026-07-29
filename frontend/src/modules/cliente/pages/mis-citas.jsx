import { useEffect, useState } from "react";
import {
  IconScissors,
  IconClock,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { supabase } from "../../../lib/supabase.js";
import { apiFetch } from "../../../utils/api.js";
import { formatearHorarioCorto } from "../../../utils/fecha.js";
import "../styles/mis-citas.css";

const ESTADOS_ACTIVOS = ["pending_payment", "pending_confirmation", "confirmed", "in_progress"];
// Anticipo fijo para todas las citas (por ahora); el resto se liquida en el local.
const ANTICIPO_FIJO_MXN = 100;

function infoEstado(cita) {
  const pagoAprobado = (cita.payments ?? []).some((p) => p.status === "approved");

  switch (cita.status) {
    case "pending_confirmation":
      return pagoAprobado
        ? { texto: "Pago recibido - falta confirmación final", tipo: "aceptada", paso: 2 }
        : { texto: "Esperando respuesta del barbero", tipo: "esperando", paso: 1 };
    case "pending_payment":
      return { texto: "Aceptada - realiza tu pago", tipo: "esperando", paso: 2 };
    case "confirmed":
      return { texto: "Cita confirmada", tipo: "aceptada", paso: 3 };
    case "in_progress":
      return { texto: "Servicio en curso", tipo: "aceptada", paso: 3 };
    default:
      return { texto: cita.status, tipo: "esperando", paso: 1 };
  }
}

const PASOS_LABELS = ["Enviada", "Aceptada", "Confirmada"];

export default function MisCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [citaDetalle, setCitaDetalle] = useState(null);
  const [citaCancelar, setCitaCancelar] = useState(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  async function obtenerCitas() {
    const { data } = await supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, total,
        barberias(name),
        barberia_memberships(display_name),
        appointment_services(service_name),
        payments(status)
      `)
      .in("status", ESTADOS_ACTIVOS)
      .order("scheduled_at");

    return data ?? [];
  }

  const cargarCitas = async () => {
    setCargando(true);
    setCitas(await obtenerCitas());
    setCargando(false);
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const data = await obtenerCitas();
      if (!cancelado) {
        setCitas(data);
        setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const handlePagar = async (cita) => {
    setProcesando(true);
    setError("");
    try {
      const { checkoutUrl } = await apiFetch("/pagos/mp/crear-preferencia", {
        method: "POST",
        body: JSON.stringify({ appointmentId: cita.id }),
      });
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err.message || "No fue posible iniciar el pago.");
      setProcesando(false);
    }
  };

  const handleConfirmarCancelacion = async () => {
    if (!citaCancelar || !motivoCancelacion.trim()) return;
    setProcesando(true);
    setError("");
    try {
      await apiFetch(`/citas/${citaCancelar.id}/cancelar`, {
        method: "POST",
        body: JSON.stringify({ motivo: motivoCancelacion.trim() }),
      });
      setCitaCancelar(null);
      setMotivoCancelacion("");
      await cargarCitas();
    } catch (err) {
      setError(err.message || "No fue posible cancelar la cita.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <div className="contenido-citas"><p>Cargando tus citas...</p></div>;
  }

  return (
    <div className="contenido-citas">
      <div className="contenedor-citas">
        <h2 className="titulo-seccion">Mis Citas Agendadas</h2>
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

        {citas.length === 0 ? (
          <div className="citas-vacias">
            <IconClock size={48} stroke={1.5} color="#a0a0a0" />
            <p>No tienes citas pendientes en este momento.</p>
          </div>
        ) : (
          <div className="lista-citas">
            {citas.map((cita) => {
              const estado = infoEstado(cita);
              const servicio = cita.appointment_services?.[0]?.service_name ?? "Servicio";
              const barberia = cita.barberias?.name ?? "Barbería";
              const barbero = cita.barberia_memberships?.display_name ?? "Por asignar";
              const horario = formatearHorarioCorto(new Date(cita.scheduled_at), new Date(cita.scheduled_at).toTimeString().slice(0, 5));

              return (
                <div key={cita.id} className="tarjeta-cita">
                  <div className="bloque-izquierdo">
                    <div className="info-header">
                      <div className="icono-servicio">
                        <IconScissors size={24} stroke={1.7} />
                      </div>
                      <div className="detalles-texto">
                        <h3>
                          {servicio} · <span className="nombre-barbero">{barbero}</span>
                        </h3>
                        <p>
                          {barberia} — <strong>{horario}</strong>
                        </p>
                      </div>
                    </div>

                    <div className={`badge-estado ${estado.tipo}`}>
                      <span className="icono-badge">
                        {estado.tipo === "aceptada" ? <IconCheck size={14} stroke={3} /> : <IconClock size={14} stroke={2.5} />}
                      </span>
                      {estado.texto}
                    </div>

                    <div className="stepper-progreso" aria-label="Progreso de la cita">
                      {PASOS_LABELS.map((label, idx) => {
                        const numero = idx + 1;
                        const estadoPaso = numero < estado.paso ? "completado" : numero === estado.paso ? "actual" : "pendiente";
                        return (
                          <span key={label} style={{ display: "contents" }}>
                            <div className={`nodo-step ${estadoPaso}`}>
                              <span className="punto-step" />
                              <span className="label-step">{label}</span>
                            </div>
                            {idx < PASOS_LABELS.length - 1 && (
                              <div className={`linea-step ${numero < estado.paso ? "activa" : ""}`} />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bloque-derecho">
                    <div className="contenedor-precio">
                      <span className="precio-cita">${Number(cita.total).toFixed(2)}</span>
                      {cita.status === "pending_payment" && (
                        <small style={{ display: "block", color: "#6b7280", fontWeight: 500 }}>
                          Anticipo a pagar: ${ANTICIPO_FIJO_MXN} MXN
                        </small>
                      )}
                    </div>

                    <div className="acciones-cita">
                      <button type="button" className="boton-accion boton-detalles" onClick={() => setCitaDetalle({ ...cita, estado, servicio, barberia, barbero, horario })}>
                        Ver detalles
                      </button>

                      {cita.status === "pending_payment" && (
                        <button type="button" className="boton-accion boton-comentario-gris" onClick={() => handlePagar(cita)} disabled={procesando}>
                          Pagar ahora
                        </button>
                      )}

                      {cita.status !== "in_progress" && (
                        <button
                          type="button"
                          className="boton-accion boton-cancelar"
                          onClick={() => { setCitaCancelar(cita); setMotivoCancelacion(""); }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
              <p><strong>Total del servicio (se paga en el local):</strong> ${Number(citaDetalle.total).toFixed(2)}</p>
              <p><strong>Anticipo por Mercado Pago:</strong> ${ANTICIPO_FIJO_MXN}.00</p>
              <p><strong>Estado:</strong> {citaDetalle.estado.texto}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cerrar" onClick={() => setCitaDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

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
              <p>Indica el motivo de la cancelación. El barbero podrá consultarlo.</p>
              <textarea
                className="textarea-comentario"
                rows="4"
                placeholder="Ej. Tuve un imprevisto y necesito cancelar la cita..."
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                required
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cerrar" onClick={() => { setCitaCancelar(null); setMotivoCancelacion(""); }} disabled={procesando}>
                Volver
              </button>
              <button className="btn-confirmar-cancelar" onClick={handleConfirmarCancelacion} disabled={!motivoCancelacion.trim() || procesando}>
                {procesando ? "Cancelando..." : "Sí, cancelar cita"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
