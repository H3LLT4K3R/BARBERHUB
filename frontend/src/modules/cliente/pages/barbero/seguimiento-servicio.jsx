import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  IconCalendar, IconClock, IconScissors,
  IconCircleCheck, IconMapPin, IconStar,
  IconMessage, IconX,
} from "@tabler/icons-react";
import "../../styles/barbero/seguimiento-servicio.css";

const PASOS = [
  { id: 1, icono: IconCalendar,     label: "Agendado"    },
  { id: 2, icono: IconClock,        label: "En espera"   },
  { id: 3, icono: IconScissors,     label: "En servicio" },
  { id: 4, icono: IconCircleCheck,  label: "Completado"  },
];

const ESTADO_A_PASO = {
  pendiente:   1,
  confirmada:  2,
  en_servicio: 3,
  completada:  4,
};

export default function SeguimientoServicio() {
  const { citaId } = useParams();
  const navigate   = useNavigate();
  const [cita,    setCita]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
  const fetchCita = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/citas/${citaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El backend aún no tiene esta ruta disponible.");
      }

      if (!res.ok) throw new Error("No se pudo cargar la cita.");
      const data = await res.json();
      setCita(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchCita();
}, [citaId]);

  const handleCancelar = async () => {
    if (!confirm("¿Seguro que deseas cancelar esta cita?")) return;
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/api/citas/${citaId}/cancelar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo cancelar.");
      navigate(-1);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="ss-loading">Cargando seguimiento...</div>;
  if (error)   return <div className="ss-error">{error}</div>;
  if (!cita)   return null;

  const pasoActivo = ESTADO_A_PASO[cita.estado] ?? 1;
  const barbero   = cita.barbero  ?? { nombre: "Carlos Reyes", foto: null, rating: 4.9, total_opiniones: 24 };
  const barberia  = cita.barberia ?? { nombre: "Black Edge Barber", direccion: "Av. Sor Juana 142, Puebla" };
  const servicios = cita.servicios ?? [{ nombre: cita.servicio ?? "Corte clásico", desc: "30 min aprox." }];

  const fechaFormateada = new Date(`${cita.fecha}T${cita.hora}`).toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });
  const horaFormateada = new Date(`${cita.fecha}T${cita.hora}`).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  return (
    <div className="ss-wrapper">
      <nav className="ss-navbar">
        <a href="/" className="ss-nav-logo">
          <img src="/barberhublogo.png" alt="Barber Hub" className="ss-logo-img" />
          <span className="ss-nav-brand">BARBER HUB</span>
        </a>
        <div className="ss-nav-links">
          <a href="/barbero/agenda">Agenda</a>
          <a href="/barbero/cobros">Cobros</a>
          <a href="/barbero/clientes">Clientes</a>
          <a href="/barbero/inventario">Inventario</a>
        </div>
      </nav>

      <div className="ss-content">
        <h1 className="ss-title">Seguimiento del servicio</h1>

        {/* STEPPER */}
        <div className="ss-stepper">
          {PASOS.map((paso, idx) => {
            const Icon  = paso.icono;
            const done  = paso.id < pasoActivo;
            const activ = paso.id === pasoActivo;
            return (
              <div className="ss-step-wrap" key={paso.id}>
                <div className="ss-step-top">
                  <div className={`ss-step-icon ${done ? "done" : activ ? "active" : ""}`}>
                    <Icon size={20} strokeWidth={1.6} />
                  </div>
                  {idx < PASOS.length - 1 && (
                    <div className={`ss-step-line ${done ? "done" : ""}`} />
                  )}
                </div>
                <div className={`ss-step-badge ${activ ? "active" : done ? "done" : ""}`}>
                  Anticipo
                </div>
                <div className={`ss-step-label ${activ ? "active" : done ? "done" : ""}`}>
                  {paso.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* CARD CENTRAL */}
        <div className="ss-barber-card">
          <div className="ss-barber-left">
            {barbero.foto
              ? <img src={barbero.foto} alt={barbero.nombre} className="ss-barber-photo" />
              : <div className="ss-barber-avatar">{barbero.nombre.charAt(0)}</div>
            }
          </div>
          <div className="ss-barber-info">
            <h2 className="ss-barber-name">{barbero.nombre} — {cita.servicio}</h2>
            <div className="ss-barber-meta"><IconMapPin size={13} /> {barberia.direccion}</div>
            <div className="ss-barber-rating">
              <IconStar size={13} color="#c9a227" fill="#c9a227" />
              {barbero.rating} ({barbero.total_opiniones})
            </div>
            <div className="ss-barber-actions">
              <a href={`https://maps.google.com/?q=${barberia.direccion}`} target="_blank" rel="noreferrer" className="ss-action-btn">
                <IconMapPin size={15} /> Maps
              </a>
              <button className="ss-action-btn"><IconMessage size={15} /> Chat</button>
              <button className="ss-cancel-btn" onClick={handleCancelar}><IconX size={13} /> Cancelar</button>
            </div>
          </div>
          <div className="ss-barber-price">${cita.precio}</div>
        </div>

        {/* INFO GRID */}
        <div className="ss-info-grid">
          <div className="ss-info-card">
            <div className="ss-info-card-title"><IconScissors size={13} /> Master barber</div>
            <div className="ss-master-row">
              {barbero.foto
                ? <img src={barbero.foto} alt={barbero.nombre} className="ss-master-foto" />
                : <div className="ss-master-av">{barbero.nombre.charAt(0)}</div>
              }
              <div className="ss-master-stats">
                <div className="ss-stat"><span className="ss-stat-val">5 años</span><span className="ss-stat-lbl">experiencia</span></div>
                <div className="ss-stat"><span className="ss-stat-val">342</span><span className="ss-stat-lbl">atendidos</span></div>
                <div className="ss-stat">
                  <span className="ss-stat-val"><IconStar size={11} color="#c9a227" fill="#c9a227" />{barbero.rating}</span>
                  <span className="ss-stat-lbl">rating</span>
                </div>
              </div>
            </div>
            <div className="ss-master-name">{barbero.nombre}</div>
          </div>

          <div className="ss-info-card">
            <div className="ss-info-card-title"><IconCalendar size={13} /> Fecha y hora</div>
            <div className="ss-datetime">{fechaFormateada} — {horaFormateada}</div>
          </div>

          <div className="ss-info-card">
            <div className="ss-info-card-title"><IconScissors size={13} /> Servicio seleccionado</div>
            {servicios.map((s, i) => (
              <div className="ss-service-item" key={i}>
                <div className="ss-service-ico"><IconScissors size={12} /></div>
                <div>
                  <div className="ss-service-name">{s.nombre}</div>
                  {s.desc && <div className="ss-service-desc">{s.desc}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="ss-info-card">
            <div className="ss-info-card-title"><IconCircleCheck size={13} /> Resumen de pago</div>
            <div className="ss-pay-row"><span className="ss-stat-lbl">Servicio</span><span className="ss-stat-val">${cita.precio}</span></div>
            <div className="ss-pay-row"><span className="ss-stat-lbl">Anticipo</span><span style={{color:"#4caf7d",fontWeight:500}}>Pagado</span></div>
            <div className="ss-pay-row ss-pay-total"><span>Total</span><span style={{color:"#c9a227",fontWeight:700}}>${cita.precio}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}