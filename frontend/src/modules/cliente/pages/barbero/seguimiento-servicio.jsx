import { useState } from "react";
import {
  CalendarCheck, CheckCircle2, Clock, MapPin, MessageCircle,
  Phone, Scissors, Star, UserRound, X,
} from "lucide-react";
import "../../styles/barbero/seguimiento-servicio.css";
import BarberoModal from "./barbero-modal";

const citaDemo = {
  servicio: "Corte + barba · Master Piece",
  fecha: "Domingo, 15 de febrero", hora: "08:00 AM", anticipo: "$100",
  cliente: { nombre: "Luis Méndez", telefono: "+52 55 1234 5678", avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop", esFrecuente: true, visitasPrevias: 6 },
  barbero: { nombre: "Master Barber", experiencia: "5 años", citas: "342 atendidas", calificacion: "5.0" },
  serviciosSeleccionados: [
    { nombre: "Corte básico", detalle: "Corte básico + vitamina" },
    { nombre: "Masaje capilar", detalle: "Extra masaje" },
  ],
};

const pasos = [
  { id: "reserva", label: "Reserva", icono: CalendarCheck },
  { id: "confirmado", label: "Confirmado", icono: Clock },
  { id: "servicio", label: "En servicio", icono: Scissors },
  { id: "finalizado", label: "Finalizado", icono: CheckCircle2 },
];
const acciones = ["Confirmar llegada", "Iniciar servicio", "Finalizar servicio", null];

export default function SeguimientoServicio() {
  const [pasoActual, setPasoActual] = useState(1);
  const [cancelada, setCancelada] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [confirmarAvance, setConfirmarAvance] = useState(false);
  const cita = citaDemo;
  const avanzar = () => { setPasoActual((paso) => Math.min(paso + 1, pasos.length - 1)); setConfirmarAvance(false); };

  return (
    <section className="ss-page">
      <header className="ss-heading">
        <div><p className="ss-eyebrow">Panel barbero</p><h2>Seguimiento del servicio</h2><p>Gestiona el avance de la cita y consulta sus detalles.</p></div>
        <span className={cancelada ? "ss-status cancelled" : "ss-status"}>{cancelada ? "Cita cancelada" : pasos[pasoActual].label}</span>
      </header>

      <div className="ss-stepper" aria-label="Estado de la cita">
        {pasos.map((paso, indice) => {
          const Icono = paso.icono;
          const completado = indice < pasoActual;
          const activo = indice === pasoActual;
          return <div className="ss-step" key={paso.id}>
            <div className="ss-step-track"><div className={`ss-step-icon ${completado ? "completed" : ""} ${activo ? "active" : ""}`}><Icono size={19} /></div>{indice < pasos.length - 1 && <div className={`ss-step-line ${completado ? "completed" : ""}`} />}</div>
            <strong className={activo ? "active" : ""}>{paso.label}</strong><span>Anticipo {cita.anticipo}</span>
          </div>;
        })}
      </div>

      <article className="ss-service-card">
        <img className="ss-service-image" src={cita.cliente.avatar} alt={cita.cliente.nombre} />
        <div className="ss-service-info"><p className="ss-card-kicker">Servicio actual</p><h3>{cita.servicio}</h3><p><MapPin size={15} /> Barber Hub · Puebla, México</p><p><Star size={15} fill="currentColor" /> {cita.barbero.calificacion} · Cliente frecuente</p><div className="ss-contact-actions"><a href={`tel:${cita.cliente.telefono}`}><Phone size={15} /> Llamar</a><button type="button" onClick={() => setChatAbierto(true)}><MessageCircle size={15} /> Chat</button></div></div>
        <div className="ss-service-controls">{acciones[pasoActual] && !cancelada && <button type="button" className="ss-advance" onClick={() => setConfirmarAvance(true)}>{acciones[pasoActual]}</button>}<button type="button" className="ss-cancel" disabled={cancelada} onClick={() => setConfirmarCancelacion(true)}><X size={15} /> {cancelada ? "Cancelada" : "Cancelar cita"}</button></div>
      </article>

      <section className="ss-details-grid">
        <article className="ss-detail-card ss-person-card"><p className="ss-card-kicker">Más información</p><h3>Cliente</h3><div className="ss-person"><img src={cita.cliente.avatar} alt={cita.cliente.nombre} /><div><strong>{cita.cliente.nombre}</strong><span><Phone size={13} /> {cita.cliente.telefono}</span></div></div><div className="ss-stats"><div><span>Tipo</span><strong>{cita.cliente.esFrecuente ? "Frecuente" : "Nuevo"}</strong></div><div><span>Visitas previas</span><strong>{cita.cliente.visitasPrevias}</strong></div></div></article>
        <article className="ss-detail-card"><p className="ss-card-kicker">Cita</p><h3>Fecha y hora</h3><p className="ss-date"><CalendarCheck size={17} /> {cita.fecha}</p><p className="ss-time"><Clock size={17} /> {cita.hora}</p></article>
        <article className="ss-detail-card"><p className="ss-card-kicker">Servicios</p><h3>Servicio seleccionado</h3><ul className="ss-service-list">{cita.serviciosSeleccionados.map((servicio) => <li key={servicio.nombre}><Scissors size={16} /><div><strong>{servicio.nombre}</strong><span>{servicio.detalle}</span></div></li>)}</ul></article>
        <article className="ss-detail-card"><p className="ss-card-kicker">Profesional</p><h3>Barbero asignado</h3><div className="ss-barber"><UserRound size={26} /><div><strong>{cita.barbero.nombre}</strong><span>Experiencia · {cita.barbero.experiencia}</span></div></div><div className="ss-stats"><div><span>Citas atendidas</span><strong>{cita.barbero.citas}</strong></div><div><span>Calificación</span><strong className="ss-star"><Star size={13} fill="currentColor" /> {cita.barbero.calificacion}</strong></div></div></article>
      </section>
      <BarberoModal open={chatAbierto} title={`Chat con ${cita.cliente.nombre}`} onClose={() => setChatAbierto(false)} footer={<button className="bm-primary" onClick={() => setChatAbierto(false)}>Enviar mensaje</button>}><div className="ss-chat"><p><strong>{cita.cliente.nombre}</strong><br />Hola, confirmo mi llegada para la cita.</p><textarea placeholder="Escribe un mensaje..." aria-label="Mensaje" /></div></BarberoModal>
      <BarberoModal open={confirmarAvance} title="Actualizar servicio" onClose={() => setConfirmarAvance(false)} footer={<><button className="bm-secondary" onClick={() => setConfirmarAvance(false)}>Volver</button><button className="bm-primary" onClick={avanzar}>Confirmar</button></>}><p>¿Deseas marcar la cita como <strong>{pasos[Math.min(pasoActual + 1, pasos.length - 1)].label}</strong>?</p></BarberoModal>
      <BarberoModal open={confirmarCancelacion} title="Cancelar cita" onClose={() => setConfirmarCancelacion(false)} footer={<><button className="bm-secondary" onClick={() => setConfirmarCancelacion(false)}>No cancelar</button><button className="bm-primary" onClick={() => { setCancelada(true); setConfirmarCancelacion(false); }}>Sí, cancelar</button></>}><p>Esta acción cambiará el estado visual de la cita a cancelada durante esta sesión.</p></BarberoModal>
    </section>
  );
}
