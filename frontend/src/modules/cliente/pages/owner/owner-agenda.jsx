import { useEffect, useState } from "react";
import { Receipt, Trash2 } from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch } from "../../../../utils/api.js";
import BarberoModal from "../barbero/barbero-modal.jsx";
import "../../styles/owner/owner-agenda.css";

// Anticipo fijo para todas las citas (por ahora); el resto se liquida en el local.
const ANTICIPO_FIJO_MXN = 75;

export default function OwnerAgenda() {
  const [barberiaId, setBarberiaId] = useState(null);
  const [citasPendientes, setCitasPendientes] = useState([]);
  const [citasComprobante, setCitasComprobante] = useState([]);
  const [citasAgendadas, setCitasAgendadas] = useState([]);
  const [citasCanceladas, setCitasCanceladas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [comprobanteRevisar, setComprobanteRevisar] = useState(null);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [motivoRechazoComprobante, setMotivoRechazoComprobante] = useState("");

  const cargarCitas = async (bid) => {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const [{ data: pendientes }, { data: pendientesPago }, { data: agendadas }, { data: canceladas }] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, scheduled_at, total, subtotal, discount_total, profiles!client_id(full_name), barberia_memberships(display_name), appointment_services(service_name), payments(status)")
        .eq("barberia_id", bid)
        .eq("status", "pending_confirmation")
        .order("scheduled_at"),
      supabase
        .from("appointments")
        .select("id, scheduled_at, total, profiles!client_id(full_name), barberia_memberships(display_name), appointment_services(service_name), payments(id, status, proof_image_path)")
        .eq("barberia_id", bid)
        .eq("status", "pending_payment")
        .order("scheduled_at"),
      supabase
        .from("appointments")
        .select("id, scheduled_at, total, profiles!client_id(full_name), barberia_memberships(display_name), appointment_services(service_name)")
        .eq("barberia_id", bid)
        .in("status", ["confirmed", "in_progress"])
        .gte("scheduled_at", hoyInicio.toISOString())
        .lte("scheduled_at", hoyFin.toISOString())
        .order("scheduled_at"),
      supabase
        .from("appointments")
        .select("id, scheduled_at, total, status, cancelled_at, cancellation_reason, profiles!client_id(full_name), appointment_services(service_name)")
        .eq("barberia_id", bid)
        .in("status", ["cancelled", "rejected", "no_show"])
        .is("hidden_by_owner_at", null)
        .order("cancelled_at", { ascending: false })
        .limit(15),
    ]);

    setCitasPendientes((pendientes ?? []).filter((c) => !(c.payments ?? []).some((p) => p.status === "approved")));
    setCitasComprobante((pendientesPago ?? []).filter((c) => (c.payments ?? []).some((p) => p.status === "pending_review")));
    setCitasAgendadas(agendadas ?? []);
    setCitasCanceladas(canceladas ?? []);
  };

  useEffect(() => {
    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: membership } = await supabase
        .from("barberia_memberships")
        .select("barberia_id")
        .eq("profile_id", uid)
        .in("role", ["owner", "admin"])
        .eq("is_active", true)
        .maybeSingle();

      if (!membership) {
        setCargando(false);
        return;
      }

      setBarberiaId(membership.barberia_id);
      await cargarCitas(membership.barberia_id);
      setCargando(false);
    }

    cargar();
  }, []);

  // Aceptar/rechazar solicitudes es trabajo del barbero (ver citas-barbero.jsx); el owner
  // solo puede revisar el estado general y confirmar/rechazar el comprobante de pago.
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
      await cargarCitas(barberiaId);
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
      await cargarCitas(barberiaId);
    } catch (err) {
      setError(err.message || "No fue posible rechazar el comprobante.");
    } finally {
      setProcesando(false);
    }
  };

  const ocultarCita = async (cita) => {
    setProcesando(true);
    setError("");
    try {
      await apiFetch(`/citas/${cita.id}/ocultar-owner`, { method: "POST", body: JSON.stringify({}) });
      setCitasCanceladas((prev) => prev.filter((c) => c.id !== cita.id));
    } catch (err) {
      setError(err.message || "No fue posible ocultar la cita.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <div className="agenda-wrapper"><p>Cargando agenda...</p></div>;
  }

  return (
    <div className="agenda-wrapper">
      <div className="agenda-main-header">
        <h1>Gestión de Agenda Activa</h1>
        <p>Consulta el estado general de las citas y revisa el comprobante de pago del anticipo. Aceptar o rechazar solicitudes es trabajo del barbero.</p>
      </div>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <div className="agenda-cards-container">
        {citasPendientes.length === 0 && <p>No hay solicitudes pendientes.</p>}
        {citasPendientes.map((cita) => (
          <div className="agenda-card-box" key={cita.id}>
            <div className="card-top-row">
              <h2 className="client-name">{cita.profiles?.full_name ?? "Cliente"}</h2>
              <span className="client-price">${Number(cita.total).toFixed(2)}</span>
            </div>

            <div className="card-details-box">
              <p><strong>Servicio solicitado:</strong> {cita.appointment_services?.[0]?.service_name ?? "-"}</p>
              <p><strong>Barbero solicitado:</strong> {cita.barberia_memberships?.display_name ?? "Cualquiera"}</p>
              <p><strong>Horario:</strong> {new Date(cita.scheduled_at).toLocaleString("es-MX")}</p>
            </div>

            <button className="btn-ready" disabled>Pendiente de respuesta del barbero</button>
          </div>
        ))}
      </div>

      <div className="agendadas-section">
        <h2>COMPROBANTES POR REVISAR</h2>

        <div className="agendadas-list">
          {citasComprobante.length === 0 && <p>No hay comprobantes pendientes de revisión.</p>}
          {citasComprobante.map((cita) => (
            <div className="agendada-row" key={cita.id}>
              <div className="agendada-info">
                <strong>{cita.profiles?.full_name ?? "Cliente"} ({cita.appointment_services?.[0]?.service_name ?? "Servicio"})</strong>
                <p>{new Date(cita.scheduled_at).toLocaleString("es-MX")} • Asignado a: {cita.barberia_memberships?.display_name ?? "Cualquiera"}</p>
              </div>

              <div className="agendada-finances">
                <div className="finances-text">
                  <p><strong>Total:</strong> ${Number(cita.total).toFixed(2)}</p>
                </div>
                <button className="btn-review" onClick={() => abrirRevisionComprobante(cita)} disabled={procesando}>
                  <Receipt size={14} /> Revisar comprobante
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="agendadas-section">
        <h2>CITAS AGENDADAS HOY</h2>

        <div className="agendadas-list">
          {citasAgendadas.length === 0 && <p>No hay citas confirmadas para hoy.</p>}
          {citasAgendadas.map((agendada) => (
            <div className="agendada-row" key={agendada.id}>
              <div className="agendada-info">
                <strong>{agendada.profiles?.full_name ?? "Cliente"} ({agendada.appointment_services?.[0]?.service_name ?? "Servicio"})</strong>
                <p>{new Date(agendada.scheduled_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} • Asignado a: {agendada.barberia_memberships?.display_name ?? "Cualquiera"}</p>
              </div>

              <div className="agendada-finances">
                <div className="finances-text">
                  <p><strong>Total:</strong> ${Number(agendada.total).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="agendadas-section">
        <h2>CANCELADAS Y RECHAZADAS RECIENTES</h2>

        <div className="agendadas-list">
          {citasCanceladas.length === 0 && <p>No hay citas canceladas o rechazadas recientemente.</p>}
          {citasCanceladas.map((cita) => (
            <div className="agendada-row" key={cita.id}>
              <div className="agendada-info">
                <strong>{cita.profiles?.full_name ?? "Cliente"} ({cita.appointment_services?.[0]?.service_name ?? "Servicio"})</strong>
                <p>
                  {new Date(cita.scheduled_at).toLocaleString("es-MX")} ·{" "}
                  {cita.status === "cancelled" ? "Cancelada por el cliente" : cita.status === "rejected" ? "Rechazada por la barbería" : "No asistió"}
                  {cita.cancellation_reason ? ` — ${cita.cancellation_reason}` : ""}
                </p>
              </div>
              <button
                className="btn-review"
                title="Ocultar de esta lista"
                onClick={() => ocultarCita(cita)}
                disabled={procesando}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

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
          style={{ marginTop: 10, width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}
          value={motivoRechazoComprobante}
          onChange={(e) => setMotivoRechazoComprobante(e.target.value)}
          placeholder="Si vas a rechazarlo, explica por qué (opcional)…"
        />
      </BarberoModal>
    </div>
  );
}
