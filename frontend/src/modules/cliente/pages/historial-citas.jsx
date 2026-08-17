import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Star, Trash2, X } from "lucide-react";
import { supabase } from "../../../lib/supabase.js";
import { apiFetch } from "../../../utils/api.js";
import "../styles/historial-citas.css";

const ESTADOS_FINALIZADOS = ["completed", "cancelled", "rejected", "no_show"];

const ESTADO_LABEL = {
  completed: "Completada",
  cancelled: "Cancelada",
  rejected: "Rechazada",
  no_show: "No asistió",
};

const ESTADO_CLASE = {
  completed: "hc-estado-completada",
  cancelled: "hc-estado-cancelada",
  rejected: "hc-estado-rechazada",
  no_show: "hc-estado-rechazada",
};

function formatearFechaLarga(fechaISO) {
  return new Date(`${fechaISO}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

export default function HistorialCitas() {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({ totalVisitas: 0, gastoTotal: 0, calificacionDada: 0 });
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [filtroPeriodo, setFiltroPeriodo] = useState("Todo");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const fechaDesdeRef = useRef(null);
  const fechaHastaRef = useRef(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;

      const [{ data: appointments }, { data: misResenas }] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id, scheduled_at, status, total, cancellation_reason, barberia_id,
            barberias(name, address_line1),
            barberia_memberships(id, display_name),
            appointment_services(service_name),
            reviews(id, rating, comment)
          `)
          .in("status", ESTADOS_FINALIZADOS)
          .is("hidden_by_client_at", null)
          .order("scheduled_at", { ascending: false }),
        uid ? supabase.from("reviews").select("rating").eq("client_id", uid) : Promise.resolve({ data: [] }),
      ]);

      if (cancelado) return;

      const lista = appointments ?? [];
      setCitas(lista);

      const completadas = lista.filter((c) => c.status === "completed");
      const gastoTotal = completadas.reduce((acc, c) => acc + Number(c.total), 0);
      const calificaciones = misResenas ?? [];
      const calificacionDada = calificaciones.length
        ? calificaciones.reduce((acc, r) => acc + r.rating, 0) / calificaciones.length
        : 0;

      setStats({ totalVisitas: completadas.length, gastoTotal, calificacionDada });
      setCargando(false);
    }

    cargar();
    return () => { cancelado = true; };
  }, []);

  const abrirCalendario = (input) => {
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    else input.focus();
  };

  const citasFiltradas = citas.filter((cita) => {
    const label = ESTADO_LABEL[cita.status];
    const coincideEstado = filtroEstado === "Todas"
      || (filtroEstado === "Completadas" ? label === "Completada"
        : filtroEstado === "Canceladas" ? label === "Cancelada"
        : filtroEstado === "Rechazadas" ? (label === "Rechazada" || label === "No asistió")
        : true);
    if (!coincideEstado) return false;

    const fechaISO = cita.scheduled_at.slice(0, 10);
    if (filtroPeriodo === "Rango personalizado") {
      return (!fechaDesde || fechaISO >= fechaDesde) && (!fechaHasta || fechaISO <= fechaHasta);
    }
    if (filtroPeriodo === "Todo") return true;

    const fechaCita = new Date(cita.scheduled_at);
    const ahora = new Date();

    if (filtroPeriodo === "Esta semana") {
      const limite = new Date(ahora);
      limite.setDate(limite.getDate() - 7);
      return fechaCita >= limite && fechaCita <= ahora;
    }
    if (filtroPeriodo === "Este mes") {
      // Desde el día 1 del mes calendario actual, no "los últimos 30 días".
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      return fechaCita >= inicioMes && fechaCita <= ahora;
    }
    // "Últimos 3 meses"
    const limite = new Date(ahora);
    limite.setMonth(limite.getMonth() - 3);
    return fechaCita >= limite && fechaCita <= ahora;
  });

  const manejarVolverAAgendar = () => {
    if (citaSeleccionada) {
      navigate("/agenda-local", {
        state: { barberiaId: citaSeleccionada.barberia_id, volverA: "/historial-citas" },
      });
    }
  };

  const manejarVerBarberia = () => {
    if (citaSeleccionada) {
      navigate(`/barberia-perfil/${citaSeleccionada.barberia_id}`, { state: { volverA: "/historial-citas" } });
    }
  };

  const ocultarDelHistorial = async (cita) => {
    try {
      await apiFetch(`/citas/${cita.id}/ocultar-cliente`, { method: "POST", body: JSON.stringify({}) });
      setCitas((prev) => prev.filter((c) => c.id !== cita.id));
      setCitaSeleccionada((prev) => (prev?.id === cita.id ? null : prev));
    } catch (err) {
      window.alert(err.message || "No fue posible ocultar la cita.");
    }
  };

  const manejarDejarResena = () => {
    if (!citaSeleccionada) return;
    navigate("/opinion-barberia-general", {
      state: {
        appointmentId: citaSeleccionada.id,
        barberiaId: citaSeleccionada.barberia_id,
        barberMembershipId: citaSeleccionada.barberia_memberships?.id,
        barberoNombre: citaSeleccionada.barberia_memberships?.display_name,
        establecimiento: citaSeleccionada.barberias?.name,
      },
    });
  };

  if (cargando) {
    return <div className="hc-contenido"><p>Cargando historial...</p></div>;
  }

  return (
    <div className="hc-contenido">
      <h1 className="hc-titulo-pagina">Historial de citas</h1>

      <div className="hc-layout">
        <main className="hc-contenido-central">
          <div className="hc-tarjetas-resumen">
            <div className="hc-tarjeta-resumen">
              <span className="hc-numero-resumen dorado">{stats.totalVisitas}</span>
              <span className="hc-etiqueta-resumen">Total visitas</span>
            </div>
            <div className="hc-tarjeta-resumen">
              <span className="hc-numero-resumen dorado">$ {stats.gastoTotal.toLocaleString("es-MX")}</span>
              <span className="hc-etiqueta-resumen">Gastado Total</span>
            </div>
            <div className="hc-tarjeta-resumen">
              <span className="hc-numero-resumen">{stats.calificacionDada.toFixed(1)}</span>
              <span className="hc-etiqueta-resumen">Calificación dada</span>
            </div>
          </div>

          <div className="hc-filtros">
            {["Todas", "Completadas", "Canceladas", "Rechazadas"].map((status) => (
              <button
                key={status}
                className={`hc-boton-filtro ${filtroEstado === status ? "activo" : ""}`}
                onClick={() => setFiltroEstado(status)}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="hc-filtros-periodo" aria-label="Filtrar historial por periodo">
            <span>Periodo:</span>
            {["Todo", "Esta semana", "Este mes", "Últimos 3 meses", "Rango personalizado"].map((periodo) => (
              <button
                key={periodo}
                className={`hc-boton-periodo ${filtroPeriodo === periodo ? "activo" : ""}`}
                onClick={() => setFiltroPeriodo(periodo)}
              >
                {periodo}
              </button>
            ))}
            {filtroPeriodo === "Rango personalizado" && (
              <div className="hc-rango-fechas">
                <label className="hc-fecha-control">
                  <span>Desde</span>
                  <input ref={fechaDesdeRef} type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} aria-label="Fecha inicial" />
                  <button type="button" className="hc-fecha-accion" onClick={() => abrirCalendario(fechaDesdeRef.current)} aria-label="Abrir calendario de fecha inicial">
                    <CalendarDays size={16} aria-hidden="true" />
                  </button>
                </label>
                <label className="hc-fecha-control">
                  <span>Hasta</span>
                  <input ref={fechaHastaRef} type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} aria-label="Fecha final" />
                  <button type="button" className="hc-fecha-accion" onClick={() => abrirCalendario(fechaHastaRef.current)} aria-label="Abrir calendario de fecha final">
                    <CalendarDays size={16} aria-hidden="true" />
                  </button>
                </label>
              </div>
            )}
          </div>

          <div className="hc-lista-citas">
            {citasFiltradas.map((cita) => {
              return (
                <div key={cita.id} className="hc-item-cita">
                  <div className="hc-info-cita">
                    <h3>{cita.appointment_services?.[0]?.service_name ?? "Servicio"} · {cita.barberia_memberships?.display_name ?? "Barbero"}</h3>
                    <p>{cita.barberias?.name}</p>
                  </div>
                  <div className="hc-acciones-cita">
                    <span className="hc-precio-cita">${Number(cita.total).toFixed(2)}</span>
                    <span className="hc-fecha-cita">{formatearFechaLarga(cita.scheduled_at.slice(0, 10))}</span>
                    <div className="hc-fila-acciones">
                      <button className="hc-boton-detalle" onClick={() => setCitaSeleccionada(cita)}>
                        Ver detalle
                      </button>
                      <span className={`hc-badge-estado ${ESTADO_CLASE[cita.status]}`}>
                        {ESTADO_LABEL[cita.status]}
                      </span>
                      <button
                        type="button"
                        className="hc-boton-ocultar"
                        title="Quitar del historial"
                        aria-label="Quitar del historial"
                        onClick={() => {
                          if (window.confirm("¿Quitar esta cita de tu historial? Esto no afecta el registro de la barbería.")) {
                            ocultarDelHistorial(cita);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {citasFiltradas.length === 0 && (
              <p className="hc-mensaje-vacio">No se encontraron citas en esta categoría.</p>
            )}
          </div>
        </main>

        {citaSeleccionada && (
          <aside className="hc-sidebar-detalle">
            <div className="hc-detalle-cita">
              <div className="hc-detalle-cita-header">
                <h3 className="hc-titulo-detalle">Detalle de cita</h3>
                <button className="hc-boton-cerrar-detalle" onClick={() => setCitaSeleccionada(null)} aria-label="Cerrar detalle">
                  <X size={18} />
                </button>
              </div>
              <p className="hc-timestamp-detalle">{formatearFechaLarga(citaSeleccionada.scheduled_at.slice(0, 10))}</p>

              <div className="hc-tarjeta-barberia-detalle">
                <span className="hc-icono-tijeras">✂</span>
                <div>
                  <h4>{citaSeleccionada.barberias?.name}</h4>
                  <p>{citaSeleccionada.barberias?.address_line1}</p>
                </div>
              </div>

              <div className="hc-tabla-detalle">
                <div className="hc-fila-detalle">
                  <span>Servicio</span>
                  <strong>{citaSeleccionada.appointment_services?.[0]?.service_name ?? "-"}</strong>
                </div>
                <div className="hc-fila-detalle">
                  <span>Barbero</span>
                  <strong>{citaSeleccionada.barberia_memberships?.display_name ?? "-"}</strong>
                </div>
                <hr className="hc-separador-detalle" />
                <div className="hc-fila-detalle">
                  <span>Total Pagado</span>
                  <strong className="dorado">${citaSeleccionada.status === "completed" ? Number(citaSeleccionada.total).toFixed(2) : "0.00"}</strong>
                </div>
              </div>

              {citaSeleccionada.cancellation_reason && (
                <div className="hc-resena-detalle hc-motivo-cancelacion">
                  <h5>Motivo</h5>
                  <p>"{citaSeleccionada.cancellation_reason}"</p>
                </div>
              )}

              {citaSeleccionada.reviews?.[0] ? (
                <div className="hc-resena-detalle">
                  <h5>Tu reseña</h5>
                  <div className="hc-estrellas-resena" aria-label={`${citaSeleccionada.reviews[0].rating} de 5 estrellas`}>
                    {Array.from({ length: 5 }, (_, indice) => (
                      <Star key={indice} size={17} fill={indice < citaSeleccionada.reviews[0].rating ? "currentColor" : "none"} />
                    ))}
                    <span>{citaSeleccionada.reviews[0].rating}/5</span>
                  </div>
                  {citaSeleccionada.reviews[0].comment && <p>"{citaSeleccionada.reviews[0].comment}"</p>}
                </div>
              ) : citaSeleccionada.status === "completed" ? (
                <div className="hc-acciones-detalle">
                  <button className="hc-boton-reagendar" onClick={manejarDejarResena}>
                    Dejar reseña
                  </button>
                </div>
              ) : null}

              <div className="hc-acciones-detalle">
                <button className="hc-boton-reagendar" onClick={manejarVolverAAgendar}>
                  Volver a agendar
                </button>
                <button className="hc-boton-ver-barberia" onClick={manejarVerBarberia}>
                  Ver barbería
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
