import { useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  User,
  MoreHorizontal,
  Star,
  Clock,
  Check,
  Scissors,
  Trash2,
  UsersRound,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch } from "../../../../utils/api.js";
import { horaDeCita, fechaCorta, esMismoDia, aNaiveISOString } from "../../../../utils/fechaCita.js";
import "../../styles/barbero/dashboard-barbero.css";
import BarberoModal from "./barbero-modal";

const ESTADOS_ACTIVOS = ["pending_confirmation", "pending_payment", "confirmed", "in_progress"];
const ESTADOS_CANCELADOS = ["cancelled", "rejected", "no_show"];
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function inicioDeSemana(offsetSemanas = 0) {
  const hoy = new Date();
  const diff = hoy.getDay() === 0 ? -6 : 1 - hoy.getDay();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff + offsetSemanas * 7);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

function inicioDelDia(fecha) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function accionesPara(cita) {
  if (cita.status === "confirmed") return [{ tipo: "iniciar", label: "Comenzar Servicio" }, { tipo: "no-asistio", label: "No asistió" }];
  if (cita.status === "in_progress") return [{ tipo: "completar", label: "Completar" }];
  return [];
}

export default function DashboardBarbero() {
  const hoy = new Date();
  const hoyIndex = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;

  const [barberiaId, setBarberiaId] = useState(null);
  const [citasSemana, setCitasSemana] = useState([]);
  const [promedioResenas, setPromedioResenas] = useState(null);
  const [clientesNuevosHoy, setClientesNuevosHoy] = useState(0);
  const [visitasPorCliente, setVisitasPorCliente] = useState(new Map());
  const [historialCompletadas, setHistorialCompletadas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [diaActivo, setDiaActivo] = useState(hoyIndex);
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
    setDiaActivo(hoyIndex);
  };

  const obtenerDatos = async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    const { data: membership } = await supabase
      .from("barberia_memberships")
      .select("barberia_id")
      .eq("profile_id", uid)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) return null;

    // Se carga desde el inicio de la semana actual hasta varias semanas adelante,
    // para que el panel de "Próximos turnos" pueda navegar a semanas futuras sin
    // volver a consultar la base de datos, mientras las métricas de "hoy" siguen
    // calculándose sobre la fecha real (no la semana que el barbero esté viendo).
    const inicioSemana = inicioDeSemana(0);
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(finSemana.getDate() + 7 * 12);

    const [{ data: citas }, { data: reviews }, { data: completadas }] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, scheduled_at, status, total, client_note, updated_at, client_id, hidden_by_barber_at, profiles!client_id(full_name, phone), appointment_services(service_name), payments(status)")
        .eq("barberia_id", membership.barberia_id)
        .gte("scheduled_at", aNaiveISOString(inicioSemana))
        .lt("scheduled_at", aNaiveISOString(finSemana))
        .is("hidden_by_barber_at", null)
        .order("scheduled_at"),
      supabase
        .from("reviews")
        .select("rating")
        .eq("barberia_id", membership.barberia_id)
        .eq("is_published", true),
      // Historial de citas terminadas: no se limita a la semana cargada, muestra
      // las más recientes que ya se cumplieron, sin importar de qué día sean.
      supabase
        .from("appointments")
        .select("id, scheduled_at, total, updated_at, client_id, profiles!client_id(full_name, phone), appointment_services(service_name)")
        .eq("barberia_id", membership.barberia_id)
        .eq("status", "completed")
        .is("hidden_by_barber_at", null)
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);

    const idsHoy = [...new Set((citas ?? [])
      .filter((c) => esMismoDia(c.scheduled_at, hoy))
      .map((c) => c.client_id))];

    let clientesNuevos = 0;
    let visitas = new Map();

    if (idsHoy.length) {
      const { data: previas } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("barberia_id", membership.barberia_id)
        .in("client_id", idsHoy)
        .lt("scheduled_at", aNaiveISOString(inicioDelDia(hoy)));
      const conHistorial = new Set((previas ?? []).map((p) => p.client_id));
      clientesNuevos = idsHoy.filter((id) => !conHistorial.has(id)).length;

      const { data: todas } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("barberia_id", membership.barberia_id)
        .in("client_id", idsHoy)
        .not("status", "in", "(cancelled,rejected)");
      for (const a of todas ?? []) visitas.set(a.client_id, (visitas.get(a.client_id) ?? 0) + 1);
    }

    return {
      barberiaId: membership.barberia_id,
      citas: citas ?? [],
      promedioResenas: reviews?.length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null,
      clientesNuevos,
      visitas,
      historialCompletadas: completadas ?? [],
    };
  };

  const aplicarDatos = (datos) => {
    if (!datos) {
      setBarberiaId(null);
      return;
    }
    setBarberiaId(datos.barberiaId);
    setCitasSemana(datos.citas);
    setPromedioResenas(datos.promedioResenas);
    setClientesNuevosHoy(datos.clientesNuevos);
    setVisitasPorCliente(datos.visitas);
    setHistorialCompletadas(datos.historialCompletadas);
  };

  const cargar = async () => {
    setCargando(true);
    aplicarDatos(await obtenerDatos());
    setCargando(false);
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const datos = await obtenerDatos();
      if (!cancelado) {
        aplicarDatos(datos);
        setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const citasHoy = citasSemana.filter((c) => esMismoDia(c.scheduled_at, hoy));
  const citasDelDia = citasSemana.filter(
    (c) => esMismoDia(c.scheduled_at, dias[diaActivo]) && !ESTADOS_CANCELADOS.includes(c.status)
  );

  const agendadasHoy = citasHoy.filter((c) => ESTADOS_ACTIVOS.includes(c.status) || c.status === "completed").length;
  // Una cancelación puede ser de una cita agendada para otro día (el cliente cancela hoy
  // una cita del jueves); por eso se cuenta por fecha de actualización, no de agenda.
  const canceladasHoy = citasSemana.filter(
    (c) => ESTADOS_CANCELADOS.includes(c.status) && new Date(c.updated_at).toDateString() === hoy.toDateString()
  ).length;
  const atendidosHoy = citasHoy.filter((c) => c.status === "completed");

  // Se busca en toda la semana cargada (no solo "hoy") para mostrar la cita más
  // cercana ya agendada, aunque sea en un día posterior.
  const hoyNaive = new Date(aNaiveISOString(hoy));
  const siguienteTurno = citasSemana
    .filter((c) => (c.status === "confirmed" || c.status === "in_progress") && new Date(c.scheduled_at) >= hoyNaive)
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];

  const metricas = [
    { etiqueta: "Reseñas", valor: promedioResenas ?? "—", icono: Star, tono: "gold" },
    { etiqueta: "Nuevos Clientes", valor: clientesNuevosHoy, icono: User, tono: "ink" },
    { etiqueta: "Agendadas", valor: agendadasHoy, icono: CalendarDays, tono: "rose" },
    { etiqueta: "Canceladas", valor: canceladasHoy, icono: CalendarX2, tono: "gray" },
    { etiqueta: "Atendidos", valor: atendidosHoy.length, icono: CheckCircle2, tono: "green" },
  ];

  const ejecutarAccion = async (tipo, cita) => {
    setProcesando(true);
    setError("");
    const endpoints = { iniciar: "iniciar", completar: "completar", "no-asistio": "no-asistio" };
    try {
      await apiFetch(`/citas/${cita.id}/${endpoints[tipo]}`, { method: "POST", body: JSON.stringify({}) });
      setCitaSeleccionada(null);
      await cargar();
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
      setCitasSemana((prev) => prev.filter((c) => c.id !== cita.id));
      setHistorialCompletadas((prev) => prev.filter((c) => c.id !== cita.id));
    } catch (err) {
      setError(err.message || "No fue posible eliminar la cita.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <section className="bd-dashboard"><p>Cargando panel...</p></section>;
  }

  if (!barberiaId) {
    return <section className="bd-dashboard"><p>No perteneces a ninguna barbería activa.</p></section>;
  }

  return (
    <section className="bd-dashboard">
      <header className="bd-heading">
        <div>
          <p className="bd-eyebrow">Panel barbero</p>
          <h2>Mi jornada</h2>
          <p>Resumen de tus turnos y clientes de hoy.</p>
        </div>
        <span className="bd-date-button" style={{ cursor: "default" }}>
          <CalendarDays size={17} /> {hoy.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </header>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {/* MÉTRICAS */}
      <div className="bd-metrics">
        {metricas.map(({ etiqueta, valor, icono: Icono, tono }) => (
          <article className={`bd-metric bd-metric--${tono}`} key={etiqueta}>
            <div>
              <span>{etiqueta}</span>
              <strong>{valor}</strong>
            </div>
            <Icono size={25} strokeWidth={1.6} />
          </article>
        ))}
      </div>

      <div className="bd-overview-grid">
        {/* PANEL DE PRÓXIMO CLIENTE */}
        <article className="bd-panel bd-sales-panel" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div className="bd-panel-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <p className="bd-panel-kicker" style={{ color: '#3b82f6', fontWeight: '600' }}>Siguiente</p>
              <h3 style={{ fontSize: '1.1rem' }}>Siguiente Turno</h3>
            </div>
            {siguienteTurno && (
              <span style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {diaYHoraCorta(siguienteTurno.scheduled_at)}
              </span>
            )}
          </div>

          {!siguienteTurno ? (
            <p style={{ color: '#64748b' }}>No tienes más turnos programados por hoy.</p>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ width: '55px', height: '55px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <User size={28} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: '700' }}>{siguienteTurno.profiles?.full_name ?? "Cliente"}</h4>
                  <span style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: '500' }}>
                    <Scissors size={14} /> {siguienteTurno.appointment_services?.[0]?.service_name ?? "Servicio"}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <UsersRound size={12} /> {visitasPorCliente.get(siguienteTurno.client_id) ?? 1} Visitas
                </span>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px dashed #cbd5e1', flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155' }}>
                  <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>Notas del cliente:</strong>
                  {siguienteTurno.client_note || "Sin notas."}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}
                  onClick={() => ejecutarAccion(siguienteTurno.status === "in_progress" ? "completar" : "iniciar", siguienteTurno)}
                  disabled={procesando}
                >
                  {siguienteTurno.status === "in_progress" ? "Completar Servicio" : "Comenzar Servicio"}
                </button>
              </div>
            </div>
          )}
        </article>

        {/* PANEL DE AGENDA */}
        <article className="bd-panel bd-agenda-panel">
          <div className="bd-panel-header">
            <div>
              <p className="bd-panel-kicker">Organización</p>
              <h3>Próximos turnos</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {semanaOffset !== 0 && (
                <button type="button" className="bd-select" onClick={volverAHoy}>
                  Volver a hoy
                </button>
              )}
              <button type="button" className="bd-select" onClick={() => cambiarSemana(1)}>
                Siguiente
              </button>
            </div>
          </div>
          <div className="bd-days">
            {dias.map((dia, index) => (
              <button type="button" className={index === diaActivo ? "active" : ""} onClick={() => setDiaActivo(index)} key={dia.toISOString()}>
                {DIAS_SEMANA[dia.getDay()]}
                <strong>{String(dia.getDate()).padStart(2, "0")}</strong>
              </button>
            ))}
          </div>
          <div className="bd-appointments">
            {citasDelDia.length === 0 && <p style={{ color: '#64748b', fontSize: '13px' }}>No hay turnos para este día.</p>}
            {citasDelDia.map((cita) => (
              <div
                className={`bd-appointment ${cita.status === "completed" || cita.status === "confirmed" || cita.status === "in_progress" ? "bd-appointment--confirmada" : "bd-appointment--pendiente"}`}
                key={cita.id}
              >
                <time>{horaDeCita(cita.scheduled_at)}</time>
                <div>
                  <strong>{cita.profiles?.full_name ?? "Cliente"} <span>·</span> {cita.appointment_services?.[0]?.service_name ?? "Servicio"}</strong>
                  <small>${Number(cita.total).toFixed(2)}</small>
                </div>
                <button type="button" onClick={() => setCitaSeleccionada(cita)} aria-label="Más opciones">
                  <MoreHorizontal size={19} />
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* SECCIÓN: HISTORIAL DE CITAS TERMINADAS */}
      <section className="bd-promotions" style={{ marginTop: '2rem' }}>
        <div className="bd-promotions-heading">
          <div>
            <p className="bd-eyebrow">Registro reciente</p>
            <h3>Historial de citas terminadas</h3>
          </div>
          <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{historialCompletadas.length} completadas</span>
        </div>

        {historialCompletadas.length === 0 ? (
          <p style={{ color: '#64748b' }}>Aún no completas ninguna cita.</p>
        ) : (
          <div className="bd-promotion-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {historialCompletadas.map((registro) => (
              <article
                className="bd-promotion"
                key={registro.id}
                style={{ borderLeft: '4px solid #10b981', padding: '1rem', backgroundColor: 'white' }}
              >
                <div className="bd-promotion-image" style={{ width: '42px', height: '42px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%' }}>
                  <Check size={20} />
                </div>
                <div className="bd-promotion-content" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <h4 style={{ color: '#0f172a' }}>{registro.profiles?.full_name ?? "Cliente"}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {fechaCorta(registro.scheduled_at)} · {horaDeCita(registro.scheduled_at)}
                    </span>
                  </div>
                  <p style={{ color: '#475569' }}>{registro.appointment_services?.[0]?.service_name ?? "Servicio"}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      title="Eliminar de la agenda"
                      onClick={() => ocultarCita(registro)}
                      disabled={procesando}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4, display: 'flex' }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <strong style={{ color: '#0f172a' }}>${Number(registro.total).toFixed(2)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MODAL DE CITA */}
      <BarberoModal
        open={Boolean(citaSeleccionada)}
        title="Detalles del turno"
        onClose={() => setCitaSeleccionada(null)}
        footer={
          citaSeleccionada && accionesPara(citaSeleccionada).length > 0 && (
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              {accionesPara(citaSeleccionada).map((a) => (
                <button
                  key={a.tipo}
                  className={a.tipo === "no-asistio" ? "bm-secondary" : "bm-primary"}
                  style={{ flex: 1, backgroundColor: a.tipo === "no-asistio" ? '#f1f5f9' : '#0f172a', color: a.tipo === "no-asistio" ? '#0f172a' : 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  onClick={() => ejecutarAccion(a.tipo, citaSeleccionada)}
                  disabled={procesando}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )
        }
      >
        <div style={{ textAlign: 'center', margin: '10px 0 20px 0' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#f1f5f9', borderRadius: '50%', margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <User size={30} />
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem' }}>{citaSeleccionada?.profiles?.full_name ?? "Cliente"}</h3>
          <p style={{ margin: 0, color: '#64748b', fontWeight: '500' }}>
            {citaSeleccionada?.appointment_services?.[0]?.service_name ?? "Servicio"} — {citaSeleccionada && horaDeCita(citaSeleccionada.scheduled_at)}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Visitas</span>
            <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{citaSeleccionada ? (visitasPorCliente.get(citaSeleccionada.client_id) ?? 1) : "-"}</strong>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Total</span>
            <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>${citaSeleccionada ? Number(citaSeleccionada.total).toFixed(2) : "-"}</strong>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
          <p style={{ margin: 0, color: '#0f172a' }}><strong>Notas del cliente:</strong> {citaSeleccionada?.client_note || "Sin notas."}</p>
        </div>
      </BarberoModal>
    </section>
  );
}
