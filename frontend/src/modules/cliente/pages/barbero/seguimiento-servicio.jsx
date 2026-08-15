import { useEffect, useState } from "react";
import {
  CalendarCheck, CheckCircle2, Clock, MapPin, Phone, Scissors, UserX,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch } from "../../../../utils/api.js";
import "../../styles/barbero/seguimiento-servicio.css";
import BarberoModal from "./barbero-modal";

// Anticipo fijo para todas las citas (por ahora); el resto se liquida en el local.
const ANTICIPO_FIJO_MXN = 100;

const PASOS = [
  { id: "reserva", label: "Reserva", icono: CalendarCheck },
  { id: "confirmado", label: "Confirmado", icono: Clock },
  { id: "servicio", label: "En servicio", icono: Scissors },
  { id: "finalizado", label: "Finalizado", icono: CheckCircle2 },
];

function pasoDeEstado(status) {
  if (status === "in_progress") return 2;
  if (status === "completed") return 3;
  return 1; // confirmed
}

function formatearFechaHora(scheduledAt) {
  const fecha = new Date(scheduledAt);
  const fechaTexto = fecha.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const horaTexto = fecha.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true });
  return { fechaTexto: fechaTexto.charAt(0).toUpperCase() + fechaTexto.slice(1), horaTexto };
}

export default function SeguimientoServicio() {
  const [cita, setCita] = useState(null);
  const [barberia, setBarberia] = useState(null);
  const [visitasPrevias, setVisitasPrevias] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [confirmarAvance, setConfirmarAvance] = useState(false);
  const [confirmarNoShow, setConfirmarNoShow] = useState(false);

  const obtenerEstado = async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    const { data: membership } = await supabase
      .from("barberia_memberships")
      .select("barberia_id, barberias(name, city)")
      .eq("profile_id", uid)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) {
      return { barberia: null, cita: null, visitasPrevias: 0 };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const { data: citas } = await supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, total, client_note,
        profiles!client_id(id, full_name, phone),
        appointment_services(service_name)
      `)
      .eq("barberia_id", membership.barberia_id)
      .in("status", ["confirmed", "in_progress"])
      .gte("scheduled_at", hoy.toISOString())
      .lt("scheduled_at", manana.toISOString())
      .order("scheduled_at");

    const citaActual = (citas ?? []).find((c) => c.status === "in_progress")
      ?? (citas ?? []).find((c) => c.status === "confirmed")
      ?? null;

    let visitasPrevias = 0;
    // Si el cliente borró su cuenta por completo, profiles queda null (ver
    // DB/add_client_full_delete_option.sql) — no hay a quién contarle visitas previas.
    if (citaActual?.profiles?.id) {
      const { count } = await supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("barberia_id", membership.barberia_id)
        .eq("client_id", citaActual.profiles.id)
        .eq("status", "completed");
      visitasPrevias = count ?? 0;
    }

    return { barberia: membership.barberias, cita: citaActual, visitasPrevias };
  };

  const cargar = async () => {
    setCargando(true);
    const resultado = await obtenerEstado();
    setBarberia(resultado.barberia);
    setCita(resultado.cita);
    setVisitasPrevias(resultado.visitasPrevias);
    setCargando(false);
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const resultado = await obtenerEstado();
      if (!cancelado) {
        setBarberia(resultado.barberia);
        setCita(resultado.cita);
        setVisitasPrevias(resultado.visitasPrevias);
        setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const avanzar = async () => {
    setProcesando(true);
    setError("");
    try {
      const endpoint = cita.status === "confirmed" ? "iniciar" : "completar";
      await apiFetch(`/citas/${cita.id}/${endpoint}`, { method: "POST", body: JSON.stringify({}) });
      setConfirmarAvance(false);
      await cargar();
    } catch (err) {
      setError(err.message || "No fue posible actualizar la cita.");
    } finally {
      setProcesando(false);
    }
  };

  const marcarNoShow = async () => {
    setProcesando(true);
    setError("");
    try {
      await apiFetch(`/citas/${cita.id}/no-asistio`, { method: "POST", body: JSON.stringify({}) });
      setConfirmarNoShow(false);
      await cargar();
    } catch (err) {
      setError(err.message || "No fue posible marcar la cita.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <section className="ss-page"><p>Cargando seguimiento...</p></section>;
  }

  if (!cita) {
    return (
      <section className="ss-page">
        <header className="ss-heading">
          <div><p className="ss-eyebrow">Panel barbero</p><h2>Seguimiento del servicio</h2><p>Gestiona el avance de la cita y consulta sus detalles.</p></div>
        </header>
        <p style={{ textAlign: "center", color: "#6b7280", padding: "48px 0" }}>
          No tienes ninguna cita confirmada o en curso hoy. Ve a "Gestión de citas" para aceptar solicitudes pendientes.
        </p>
      </section>
    );
  }

  const pasoActual = pasoDeEstado(cita.status);
  const { fechaTexto, horaTexto } = formatearFechaHora(cita.scheduled_at);
  const servicios = cita.appointment_services ?? [];
  const accionLabel = cita.status === "confirmed" ? "Iniciar servicio" : "Finalizar servicio";

  return (
    <section className="ss-page">
      <header className="ss-heading">
        <div><p className="ss-eyebrow">Panel barbero</p><h2>Seguimiento del servicio</h2><p>Gestiona el avance de la cita y consulta sus detalles.</p></div>
        <span className="ss-status">{PASOS[pasoActual].label}</span>
      </header>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <div className="ss-stepper" aria-label="Estado de la cita">
        {PASOS.map((paso, indice) => {
          const Icono = paso.icono;
          const completado = indice < pasoActual;
          const activo = indice === pasoActual;
          return (
            <div className="ss-step" key={paso.id}>
              <div className="ss-step-track">
                <div className={`ss-step-icon ${completado ? "completed" : ""} ${activo ? "active" : ""}`}><Icono size={19} /></div>
                {indice < PASOS.length - 1 && <div className={`ss-step-line ${completado ? "completed" : ""}`} />}
              </div>
              <strong className={activo ? "active" : ""}>{paso.label}</strong><span>Anticipo ${ANTICIPO_FIJO_MXN}</span>
            </div>
          );
        })}
      </div>

      <article className="ss-service-card">
        <div className="ss-service-info">
          <p className="ss-card-kicker">Servicio actual</p>
          <h3>{servicios.map((s) => s.service_name).join(" + ") || "Servicio"}</h3>
          <p><MapPin size={15} /> {barberia?.name} · {barberia?.city}</p>
          <div className="ss-contact-actions">
            <a href={`tel:${cita.profiles?.phone ?? ""}`}><Phone size={15} /> Llamar</a>
          </div>
        </div>
        <div className="ss-service-controls">
          {cita.status !== "completed" && (
            <button type="button" className="ss-advance" disabled={procesando} onClick={() => setConfirmarAvance(true)}>{accionLabel}</button>
          )}
          {cita.status === "confirmed" && (
            <button type="button" className="ss-cancel" disabled={procesando} onClick={() => setConfirmarNoShow(true)}><UserX size={15} /> No asistió</button>
          )}
        </div>
      </article>

      <section className="ss-details-grid">
        <article className="ss-detail-card ss-person-card">
          <p className="ss-card-kicker">Más información</p><h3>Cliente</h3>
          <div className="ss-person"><div><strong>{cita.profiles?.full_name ?? "Cliente eliminado"}</strong><span><Phone size={13} /> {cita.profiles?.phone ?? "Sin teléfono"}</span></div></div>
          <div className="ss-stats">
            <div><span>Tipo</span><strong>{visitasPrevias > 0 ? "Frecuente" : "Nuevo"}</strong></div>
            <div><span>Visitas previas</span><strong>{visitasPrevias}</strong></div>
          </div>
        </article>
        <article className="ss-detail-card"><p className="ss-card-kicker">Cita</p><h3>Fecha y hora</h3><p className="ss-date"><CalendarCheck size={17} /> {fechaTexto}</p><p className="ss-time"><Clock size={17} /> {horaTexto}</p></article>
        <article className="ss-detail-card">
          <p className="ss-card-kicker">Servicios</p><h3>Servicio seleccionado</h3>
          <ul className="ss-service-list">
            {servicios.map((servicio) => <li key={servicio.service_name}><Scissors size={16} /><div><strong>{servicio.service_name}</strong></div></li>)}
          </ul>
        </article>
      </section>

      <BarberoModal open={confirmarAvance} title="Actualizar servicio" onClose={() => setConfirmarAvance(false)} footer={<><button className="bm-secondary" onClick={() => setConfirmarAvance(false)}>Volver</button><button className="bm-primary" onClick={avanzar} disabled={procesando}>Confirmar</button></>}>
        <p>¿Deseas marcar la cita como <strong>{PASOS[Math.min(pasoActual + 1, PASOS.length - 1)].label}</strong>?</p>
      </BarberoModal>
      <BarberoModal open={confirmarNoShow} title="Marcar como no asistió" onClose={() => setConfirmarNoShow(false)} footer={<><button className="bm-secondary" onClick={() => setConfirmarNoShow(false)}>Volver</button><button className="bm-primary" onClick={marcarNoShow} disabled={procesando}>Sí, no asistió</button></>}>
        <p>Esta acción marcará la cita como no asistida.</p>
      </BarberoModal>
    </section>
  );
}
