import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch } from "../../../../utils/api.js";
import "../../styles/owner/owner-agenda.css";

export default function OwnerAgenda() {
  const [barberiaId, setBarberiaId] = useState(null);
  const [citasPendientes, setCitasPendientes] = useState([]);
  const [citasAgendadas, setCitasAgendadas] = useState([]);
  const [citasCanceladas, setCitasCanceladas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  const cargarCitas = async (bid) => {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const [{ data: pendientes }, { data: agendadas }, { data: canceladas }] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, scheduled_at, total, subtotal, discount_total, profiles!client_id(full_name), barberia_memberships(display_name), appointment_services(service_name), payments(status)")
        .eq("barberia_id", bid)
        .eq("status", "pending_confirmation")
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
        .order("cancelled_at", { ascending: false })
        .limit(15),
    ]);

    setCitasPendientes((pendientes ?? []).filter((c) => !(c.payments ?? []).some((p) => p.status === "approved")));
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

  const aceptarCita = async (cita) => {
    setProcesando(true);
    setError("");
    try {
      await apiFetch(`/citas/${cita.id}/aceptar`, { method: "POST", body: JSON.stringify({}) });
      await cargarCitas(barberiaId);
    } catch (err) {
      setError(err.message || "No fue posible aceptar la cita.");
    } finally {
      setProcesando(false);
    }
  };

  const rechazarCita = async (cita) => {
    setProcesando(true);
    setError("");
    try {
      await apiFetch(`/citas/${cita.id}/rechazar`, { method: "POST", body: JSON.stringify({ motivo: "Rechazada desde el panel del dueño." }) });
      await cargarCitas(barberiaId);
    } catch (err) {
      setError(err.message || "No fue posible rechazar la cita.");
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
        <p>Acepta o rechaza solicitudes de citas móviles y supervisa el pago de anticipos obligatorios.</p>
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

            <div className="card-action-buttons">
              <button className="btn-accept" onClick={() => aceptarCita(cita)} disabled={procesando}>Aceptar</button>
              <button className="btn-reject" onClick={() => rechazarCita(cita)} disabled={procesando}>Rechazar</button>
            </div>
          </div>
        ))}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
