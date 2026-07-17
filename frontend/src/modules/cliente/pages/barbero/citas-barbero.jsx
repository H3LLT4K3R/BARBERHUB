import { useState } from "react";
import { CalendarDays, ChevronDown, UsersRound } from "lucide-react";
import "../../styles/barbero/citas-barbero.css";
import BarberoModal from "./barbero-modal";

const dias = ["Lun 01", "Mar 02", "Mié 03", "Jue 04", "Vie 05", "Sáb 06", "Dom 07"];
const citasIniciales = [
  { id: 1, hora: "10:00 AM", cliente: "Laura Martínez", servicio: "Shave & Haircut", precio: "$150", nota: "Cliente frecuente", estado: "confirmada" },
  { id: 2, hora: "11:30 AM", cliente: "Carlos Ruiz", servicio: "Corte clásico", precio: "$180", nota: "Primera visita", estado: "confirmada" },
  { id: 3, hora: "02:00 PM", cliente: "Mina Za", servicio: "Corte + barba", precio: "$320", nota: "Cliente nuevo", estado: "pendiente" },
  { id: 4, hora: "04:00 PM", cliente: "Andrés López", servicio: "Perfilado de barba", precio: "$220", nota: "Piel sensible", estado: "neutral" },
];

export default function CitasBarbero() {
  const [citas, setCitas] = useState(citasIniciales);
  const [diaActivo, setDiaActivo] = useState(0);
  const [accion, setAccion] = useState(null);
  const [motivo, setMotivo] = useState("");
  const actualizar = (estado) => { setCitas((actual) => actual.map((cita) => cita.id === accion?.id ? { ...cita, estado } : cita)); setAccion(null); setMotivo(""); };
  return <section className="ba-page">
    <header className="ba-heading"><div><p>Panel barbero</p><h2>Gestión de citas</h2><span>Organiza tu jornada y responde a las solicitudes de reserva.</span></div><button type="button" onClick={() => setAccion({ tipo: "agenda" })}><CalendarDays size={16} /> Agenda <ChevronDown size={15} /></button></header>
    <div className="ba-summary"><div><strong>{citas.length + 11}</strong><span>Agendadas</span></div><UsersRound size={30} /></div>
    <div className="ba-days">{dias.map((dia, index) => <button type="button" className={diaActivo === index ? "active" : ""} key={dia} onClick={() => setDiaActivo(index)}>{dia.split(" ")[0]}<strong>{dia.split(" ")[1]}</strong></button>)}</div>
    <section className="ba-agenda">{citas.map((cita) => <article className={`ba-cita ba-cita--${cita.estado}`} key={cita.id}><time>{cita.hora}</time><i /><div className="ba-cita-info"><strong>{cita.cliente} <span>·</span> {cita.servicio}</strong><small>{cita.precio}</small><small>Notas: {cita.nota}</small></div><div className="ba-actions"><button className="accept" onClick={() => setAccion({ tipo: "aceptar", ...cita })}>Aceptar</button><button className="cancel" onClick={() => setAccion({ tipo: "cancelar", ...cita })}>Cancelar</button><button className="reject" onClick={() => setAccion({ tipo: "rechazar", ...cita })}>Rechazar</button><button className="reason" onClick={() => setAccion({ tipo: "motivo", ...cita })}>Motivo</button></div></article>)}</section>
    <BarberoModal open={accion?.tipo === "agenda"} title="Vista de agenda" onClose={() => setAccion(null)} footer={<button className="bm-primary" onClick={() => setAccion(null)}>Aplicar</button>}><p>Mostrando las citas de {dias[diaActivo]}. Puedes cambiar el día directamente desde la agenda.</p></BarberoModal>
    <BarberoModal open={accion?.tipo === "aceptar"} title="Aceptar cita" onClose={() => setAccion(null)} footer={<><button className="bm-secondary" onClick={() => setAccion(null)}>Cancelar</button><button className="bm-primary" onClick={() => actualizar("confirmada")}>Aceptar cita</button></>}><p>¿Confirmas la cita de <strong>{accion?.cliente}</strong> a las {accion?.hora}?</p></BarberoModal>
    <BarberoModal open={accion?.tipo === "cancelar" || accion?.tipo === "rechazar"} title={accion?.tipo === "cancelar" ? "Cancelar cita" : "Rechazar cita"} onClose={() => setAccion(null)} footer={<><button className="bm-secondary" onClick={() => setAccion(null)}>Volver</button><button className="bm-primary" onClick={() => actualizar("pendiente")}>Confirmar</button></>}><p>La cita de {accion?.cliente} cambiará de estado temporalmente durante esta sesión.</p></BarberoModal>
    <BarberoModal open={accion?.tipo === "motivo"} title="Agregar motivo" onClose={() => setAccion(null)} footer={<button className="bm-primary" onClick={() => actualizar("neutral")}>Guardar motivo</button>}><textarea className="ba-textarea" value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Explica el motivo para el cliente…" /></BarberoModal>
  </section>;
}
