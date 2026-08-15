import { useEffect, useState } from "react";
import { Receipt, Trash2, UsersRound } from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch } from "../../../../utils/api.js";
import "../../styles/barbero/citas-barbero.css";
import BarberoModal from "./barbero-modal";

const ESTADOS_ACTIVOS = ["pending_confirmation", "pending_payment", "confirmed", "in_progress"];
const ESTADOS_TERMINALES = ["cancelled", "rejected", "no_show"];
const ESTADOS_OCULTABLES = ["cancelled", "rejected", "no_show", "completed"];
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
// Anticipo fijo para todas las citas (por ahora); el resto se liquida en el local.
const ANTICIPO_FIJO_MXN = 100;

function inicioDeSemana(offsetSemanas = 0) {
  const hoy = new Date();
  const diff = hoy.getDay() === 0 ? -6 : 1 - hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff + offsetSemanas * 7);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function infoEstado(cita) {
  const pagos = cita.payments ?? [];
  const pagoAprobado = pagos.some((p) => p.status === "approved");
  const pagoEnRevision = pagos.some((p) => p.status === "pending_review");
  switch (cita.status) {
    case "pending_confirmation":
      return pagoAprobado
        ? { texto: "Pago recibido - confirmar al 100%", clase: "pendiente" }
        : { texto: "Solicitud nueva - por aceptar", clase: "pendiente" };
    case "pending_payment":
      return pagoEnRevision
        ? { texto: "Comprobante recibido - por revisar", clase: "pendiente" }
        : { texto: "Aceptada - esperando pago del cliente", clase: "confirmada" };
    case "confirmed":
      return { texto: "Confirmada", clase: "confirmada" };
    case "in_progress":
      return { texto: "En curso", clase: "neutral" };
    case "cancelled":
      return { texto: `Cancelada por el cliente${cita.cancellation_reason ? ` — ${cita.cancellation_reason}` : ""}`, clase: "neutral" };
    case "rejected":
      return { texto: `Rechazada${cita.cancellation_reason ? ` — ${cita.cancellation_reason}` : ""}`, clase: "neutral" };
    case "no_show":
      return { texto: "El cliente no asistió", clase: "neutral" };
    default:
      return { texto: cita.status, clase: "neutral" };
  }
}

function accionesParaCita(cita) {
  const pagoAprobado = (cita.payments ?? []).some((p) => p.status === "approved");
  const acciones = [];

  if (cita.status === "pending_confirmation" && !pagoAprobado) {
    acciones.push({ tipo: "aceptar", label: "Aceptar" });
    acciones.push({ tipo: "rechazar", label: "Rechazar" });
  }
  if (cita.status === "pending_confirmation" && pagoAprobado) {
    acciones.push({ tipo: "confirmar", label: "Confirmar 100%" });
  }
  if (cita.status === "pending_payment") {
    acciones.push({ tipo: "rechazar", label: "Cancelar" });
  }
  if (cita.status === "confirmed") {
    acciones.push({ tipo: "iniciar", label: "Iniciar servicio" });
    acciones.push({ tipo: "no-asistio", label: "No asistió" });
  }
  if (cita.status === "in_progress") {
    acciones.push({ tipo: "completar", label: "Completar" });
  }
  return acciones;
}

export default function CitasBarbero() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [diaActivo, setDiaActivo] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [accion, setAccion] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [comprobanteRevisar, setComprobanteRevisar] = useState(null);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [motivoRechazoComprobante, setMotivoRechazoComprobante] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const dias = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date(inicioDeSemana(semanaOffset));
    fecha.setDate(fecha.getDate() + i);
    return fecha;
  });

  const cambiarSemana = (delta) => {
    setSemanaOffset((prev) => Math.max(0, prev + delta));
    setDiaActivo(0);
  };

  const volverAHoy = () => {
    setSemanaOffset(0);
    setDiaActivo(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  };

  async function obtenerCitas() {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    const { data: membership } = await supabase
      .from("barberia_memberships")
      .select("barberia_id")
      .eq("profile_id", uid)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) return [];

    const { data } = await supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, total, client_note, cancellation_reason,
        profiles!client_id(full_name, phone),
        appointment_services(service_name),
        payments(id, status, proof_image_path)
      `)
      .eq("barberia_id", membership.barberia_id)
      .in("status", [...ESTADOS_ACTIVOS, ...ESTADOS_TERMINALES])
      .is("hidden_by_barber_at", null)
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

  const citasDelDia = citas.filter((c) => {
    const fecha = new Date(c.scheduled_at);
    return fecha.toDateString() === dias[diaActivo].toDateString();
  });

  const finSemana = new Date(dias[6]);
  finSemana.setHours(23, 59, 59, 999);
  const citasDeLaSemana = citas.filter((c) => {
    const fecha = new Date(c.scheduled_at);
    return fecha >= dias[0] && fecha <= finSemana && ESTADOS_ACTIVOS.includes(c.status);
  });

  const ejecutarAccion = async (tipo, cita, motivoTexto) => {
    setProcesando(true);
    setError("");
    const endpoints = {
      aceptar: "aceptar",
      rechazar: "rechazar",
      confirmar: "confirmar",
      iniciar: "iniciar",
      completar: "completar",
      "no-asistio": "no-asistio",
    };

    try {
      await apiFetch(`/citas/${cita.id}/${endpoints[tipo]}`, {
        method: "POST",
        body: JSON.stringify(tipo === "rechazar" ? { motivo: motivoTexto || "" } : {}),
      });
      setAccion(null);
      setMotivo("");
      await cargarCitas();
    } catch (err) {
      setError(err.message || "No fue posible actualizar la cita.");
    } finally {
      setProcesando(false);
    }
  };

  const ocultarCita = async (cita) => {
    setProcesando(true);
    setError("");
    try {
      await apiFetch(`/citas/${cita.id}/ocultar`, { method: "POST", body: JSON.stringify({}) });
      setCitas((prev) => prev.filter((c) => c.id !== cita.id));
    } catch (err) {
      setError(err.message || "No fue posible eliminar la cita.");
    } finally {
      setProcesando(false);
    }
  };

  const abrirRevisionComprobante = async (cita) => {
    setError("");
    setMotivoRechazoComprobante("");
    setComprobanteRevisar(cita);
    setComprobanteUrl("");
    const pago = (cita.payments ?? []).find((p) => p.status === "pending_review");
    if (!pago?.proof_image_path) return;
    const { data, error: urlError } = await supabase.storage
      .from("comprobantes")
      .createSignedUrl(pago.proof_image_path, 300);
    if (!urlError) setComprobanteUrl(data.signedUrl);
  };

  const confirmarPagoManual = async (cita) => {
    setProcesando(true);
    setError("");
    try {
      await apiFetch(`/citas/${cita.id}/confirmar-pago`, { method: "POST", body: JSON.stringify({}) });
      setComprobanteRevisar(null);
      await cargarCitas();
    } catch (err) {
      setError(err.message || "No fue posible confirmar el pago.");
    } finally {
      setProcesando(false);
    }
  };

  const rechazarComprobante = async (cita, motivoTexto) => {
    setProcesando(true);
    setError("");
    try {
      await apiFetch(`/citas/${cita.id}/rechazar-comprobante`, { method: "POST", body: JSON.stringify({ motivo: motivoTexto || "" }) });
      setComprobanteRevisar(null);
      await cargarCitas();
    } catch (err) {
      setError(err.message || "No fue posible rechazar el comprobante.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <section className="ba-page"><p>Cargando citas...</p></section>;
  }

  return (
    <section className="ba-page">
      <header className="ba-heading">
        <div>
          <p>Panel barbero</p>
          <h2>Gestión de citas</h2>
          <span>Organiza tu jornada y responde a las solicitudes de reserva.</span>
        </div>
      </header>

      <div className="ba-summary">
        <div><strong>{citasDeLaSemana.length}</strong><span>Activas esta semana</span></div>
        <UsersRound size={30} />
      </div>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <div className="ba-semana-nav" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, margin: "16px 0 8px" }}>
        <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 600 }}>
          {dias[0].toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – {dias[6].toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
          {semanaOffset !== 0 && (
            <button type="button" onClick={volverAHoy} style={{ marginLeft: "10px", background: "none", border: "none", color: "#a77b24", cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}>
              Volver a hoy
            </button>
          )}
        </span>
        <button type="button" onClick={() => cambiarSemana(1)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontWeight: 600 }}>
          Semana siguiente →
        </button>
      </div>

      <div className="ba-days">
        {dias.map((fecha, index) => (
          <button
            type="button"
            className={diaActivo === index ? "active" : ""}
            key={fecha.toISOString()}
            onClick={() => setDiaActivo(index)}
          >
            {DIAS_SEMANA[fecha.getDay()]}
            <strong>{String(fecha.getDate()).padStart(2, "0")}</strong>
          </button>
        ))}
      </div>

      <section className="ba-agenda">
        {citasDelDia.length === 0 && <p>No hay citas para este día.</p>}
        {citasDelDia.map((cita) => {
          const estado = infoEstado(cita);
          const hora = new Date(cita.scheduled_at).toTimeString().slice(0, 5);
          const acciones = accionesParaCita(cita);
          const pagoEnRevision = (cita.payments ?? []).some((p) => p.status === "pending_review");

          return (
            <article className={`ba-cita ba-cita--${estado.clase}`} key={cita.id}>
              <time>{hora}</time>
              <i />
              <div className="ba-cita-info">
                <strong>{cita.profiles?.full_name ?? "Cliente"} <span>·</span> {cita.appointment_services?.[0]?.service_name ?? "Servicio"}</strong>
                <small>${Number(cita.total).toFixed(2)}</small>
                <small>{estado.texto}</small>
                {cita.client_note && <small>Notas: {cita.client_note}</small>}
              </div>
              <div className="ba-actions">
                {pagoEnRevision && (
                  <button className="accept" onClick={() => abrirRevisionComprobante(cita)} disabled={procesando}>
                    <Receipt size={14} /> Revisar comprobante
                  </button>
                )}
                {acciones.map((a) => (
                  <button
                    key={a.tipo}
                    className={a.tipo === "rechazar" || a.tipo === "no-asistio" ? "reject" : a.tipo === "confirmar" || a.tipo === "aceptar" ? "accept" : "cancel"}
                    onClick={() => (a.tipo === "rechazar" ? setAccion({ tipo: "rechazar", cita }) : ejecutarAccion(a.tipo, cita))}
                    disabled={procesando}
                  >
                    {a.label}
                  </button>
                ))}
                {ESTADOS_OCULTABLES.includes(cita.status) && (
                  <button
                    className="reject"
                    title="Eliminar de la agenda"
                    onClick={() => ocultarCita(cita)}
                    disabled={procesando}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <BarberoModal
        open={accion?.tipo === "rechazar"}
        title="Motivo"
        onClose={() => setAccion(null)}
        footer={
          <>
            <button className="bm-secondary" onClick={() => setAccion(null)}>Volver</button>
            <button className="bm-primary" onClick={() => ejecutarAccion("rechazar", accion.cita, motivo)} disabled={procesando}>
              Confirmar
            </button>
          </>
        }
      >
        <textarea className="ba-textarea" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Explica el motivo para el cliente…" />
      </BarberoModal>

      <BarberoModal
        open={Boolean(comprobanteRevisar)}
        title="Revisar comprobante de pago"
        onClose={() => setComprobanteRevisar(null)}
        footer={
          <>
            <button className="bm-secondary" onClick={() => rechazarComprobante(comprobanteRevisar, motivoRechazoComprobante)} disabled={procesando}>
              Rechazar
            </button>
            <button className="bm-primary" onClick={() => confirmarPagoManual(comprobanteRevisar)} disabled={procesando}>
              Confirmar pago recibido
            </button>
          </>
        }
      >
        <p style={{ margin: "0 0 10px" }}>
          <strong>{comprobanteRevisar?.profiles?.full_name ?? "Cliente"}</strong> — anticipo esperado: <strong>${ANTICIPO_FIJO_MXN} MXN</strong>
        </p>
        {comprobanteUrl ? (
          <img src={comprobanteUrl} alt="Comprobante de pago" style={{ width: "100%", borderRadius: 8, border: "1px solid #e5e7eb" }} />
        ) : (
          <p style={{ color: "#6b7280" }}>Cargando comprobante...</p>
        )}
        <textarea
          className="ba-textarea"
          style={{ marginTop: 10 }}
          value={motivoRechazoComprobante}
          onChange={(e) => setMotivoRechazoComprobante(e.target.value)}
          placeholder="Si vas a rechazarlo, explica por qué (opcional)…"
        />
      </BarberoModal>
    </section>
  );
}
