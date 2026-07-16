import { useState } from "react";
import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  MoreHorizontal,
  Scissors,
  Star,
} from "lucide-react";
import "../../styles/barbero/dashboard-barbero.css";
import BarberoModal from "./barbero-modal";

const metricas = [
  { etiqueta: "Reseñas", valor: "30", icono: Star, tono: "gold" },
  { etiqueta: "Ganancias", valor: "$45.3k", icono: CircleDollarSign, tono: "ink" },
  { etiqueta: "Agendadas", valor: "25", icono: CalendarDays, tono: "rose" },
  { etiqueta: "Canceladas", valor: "0", icono: CalendarX2, tono: "gray" },
  { etiqueta: "Atendidos", valor: "12", icono: CheckCircle2, tono: "green" },
];

const citas = [
  { hora: "10:00", cliente: "Laura Martínez", servicio: "Shave & Haircut", importe: "$150", nota: "Cliente frecuente", estado: "confirmada" },
  { hora: "11:30", cliente: "Carlos Ruiz", servicio: "Corte clásico", importe: "$180", nota: "Primera visita", estado: "pendiente" },
  { hora: "13:00", cliente: "Miguel Torres", servicio: "Corte + barba", importe: "$320", nota: "Solicita degradado", estado: "confirmada" },
  { hora: "16:00", cliente: "Andrés López", servicio: "Perfilado de barba", importe: "$220", nota: "Piel sensible", estado: "neutral" },
];

const promociones = [
  { nombre: "Haircut", precio: "$150", calificacion: "4.8", vistas: "1,250" },
  { nombre: "Corte + barba", precio: "$250", calificacion: "4.9", vistas: "980" },
  { nombre: "Fade premium", precio: "$300", calificacion: "4.7", vistas: "746" },
  { nombre: "Afeitado clásico", precio: "$180", calificacion: "4.8", vistas: "632" },
];

const dias = ["Lun 26", "Mar 27", "Mié 28", "Jue 29", "Vie 30", "Sáb 01"];

export default function DashboardBarbero() {
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [promoSeleccionada, setPromoSeleccionada] = useState(null);
  const [verPromociones, setVerPromociones] = useState(false);
  const [verAgenda, setVerAgenda] = useState(false);
  const [diaActivo, setDiaActivo] = useState(0);
  const [filtroAbierto, setFiltroAbierto] = useState("");
  return (
    <section className="bd-dashboard">
      <header className="bd-heading">
        <div>
          <p className="bd-eyebrow">Panel barbero</p>
          <h2>Inicio barbería</h2>
          <p>Resumen de tu actividad y agenda de hoy.</p>
        </div>
        <button className="bd-date-button" type="button" onClick={() => setVerAgenda(true)}>
          <CalendarDays size={17} /> Lunes, 26 mayo 2026 <ChevronDown size={16} />
        </button>
      </header>

      <div className="bd-metrics" aria-label="Resumen de métricas">
        {metricas.map(({ etiqueta, valor, icono: Icono, tono }) => (
          <article className={`bd-metric bd-metric--${tono}`} key={etiqueta}>
            <div>
              <span>{etiqueta}</span>
              <strong>{valor}</strong>
            </div>
            <Icono size={25} strokeWidth={1.6} aria-hidden="true" />
          </article>
        ))}
      </div>

      <div className="bd-overview-grid">
        <article className="bd-panel bd-sales-panel">
          <div className="bd-panel-header">
            <div><p className="bd-panel-kicker">Rendimiento</p><h3>Ventas</h3></div>
            <button type="button" className="bd-select" onClick={() => setFiltroAbierto("ventas")}>Mes <ChevronDown size={15} /></button>
          </div>
          <p className="bd-chart-title">Ganancias por mes</p>
          <div className="bd-chart" role="img" aria-label="Gráfica de ganancias mensuales">
            <div className="bd-chart-scale"><span>$15k</span><span>$10k</span><span>$5k</span><span>$0</span></div>
            <div className="bd-chart-bars">
              {[42, 64, 86, 51, 72, 47, 58].map((altura, index) => (
                <div className="bd-bar-wrap" key={index}>
                  <div className="bd-bar" style={{ height: `${altura}%` }} />
                  <span>{["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"][index]}</span>
                </div>
              ))}
            </div>
          </div>
          <footer className="bd-sales-footer"><span>Este mes</span><strong>$12,480</strong><span className="bd-positive">+12.5%</span></footer>
        </article>

        <article className="bd-panel bd-agenda-panel">
          <div className="bd-panel-header">
            <div><p className="bd-panel-kicker">Tu jornada</p><h3>Citas agendadas</h3></div>
            <button type="button" className="bd-select" onClick={() => setFiltroAbierto("agenda")}>Agenda <ChevronDown size={15} /></button>
          </div>
          <div className="bd-days">{dias.map((dia, index) => <button type="button" className={index === diaActivo ? "active" : ""} onClick={() => setDiaActivo(index)} key={dia}>{dia}</button>)}</div>
          <div className="bd-appointments">
            {citas.map((cita) => (
              <div className={`bd-appointment bd-appointment--${cita.estado}`} key={`${cita.hora}-${cita.cliente}`}>
                <time>{cita.hora}</time>
                <div><strong>{cita.cliente} <span>·</span> {cita.servicio}</strong><small>{cita.importe} · {cita.nota}</small></div>
                <button type="button" onClick={() => setCitaSeleccionada(cita)} aria-label={`Más opciones para ${cita.cliente}`}><MoreHorizontal size={19} /></button>
              </div>
            ))}
          </div>
        </article>
      </div>

      <section className="bd-promotions">
        <div className="bd-promotions-heading"><div><p className="bd-eyebrow">Catálogo</p><h3>Promociones activas</h3></div><button type="button" onClick={() => setVerPromociones(true)}>Ver todas</button></div>
        <div className="bd-promotion-grid">
          {promociones.map((promo) => (
            <article className="bd-promotion" role="button" tabIndex="0" onClick={() => setPromoSeleccionada(promo)} onKeyDown={(event) => event.key === "Enter" && setPromoSeleccionada(promo)} key={promo.nombre}>
              <div className="bd-promotion-image"><Scissors size={28} /><span>Promo</span></div>
              <div className="bd-promotion-content"><div><h4>{promo.nombre}</h4><p><Star size={13} fill="currentColor" /> {promo.calificacion} <span>· {promo.vistas} vistas</span></p></div><strong>{promo.precio}</strong></div>
            </article>
          ))}
        </div>
      </section>
      <BarberoModal open={Boolean(citaSeleccionada)} title="Detalle de la cita" onClose={() => setCitaSeleccionada(null)} footer={<button className="bm-primary" onClick={() => setCitaSeleccionada(null)}>Entendido</button>}><p><strong>{citaSeleccionada?.cliente}</strong> tiene una cita de {citaSeleccionada?.servicio}.</p><p>Hora: {citaSeleccionada?.hora} · Importe: {citaSeleccionada?.importe}</p><p>Nota: {citaSeleccionada?.nota}</p></BarberoModal>
      <BarberoModal open={Boolean(promoSeleccionada)} title="Detalle de promoción" onClose={() => setPromoSeleccionada(null)} footer={<button className="bm-primary" onClick={() => setPromoSeleccionada(null)}>Cerrar</button>}><p><strong>{promoSeleccionada?.nombre}</strong> · {promoSeleccionada?.precio}</p><p>Calificación {promoSeleccionada?.calificacion} y {promoSeleccionada?.vistas} visualizaciones.</p></BarberoModal>
      <BarberoModal open={verPromociones} title="Promociones activas" onClose={() => setVerPromociones(false)} footer={<button className="bm-primary" onClick={() => setVerPromociones(false)}>Cerrar</button>}><p>Actualmente tienes {promociones.length} promociones activas.</p>{promociones.map((promo) => <p key={promo.nombre}><strong>{promo.nombre}</strong> — {promo.precio}</p>)}</BarberoModal>
      <BarberoModal open={verAgenda} title="Agenda del día" onClose={() => setVerAgenda(false)} footer={<button className="bm-primary" onClick={() => setVerAgenda(false)}>Ver agenda</button>}><p>Estás consultando la agenda del lunes 26 de mayo de 2026.</p><p>Hay {citas.length} citas registradas para este día.</p></BarberoModal>
      <BarberoModal open={Boolean(filtroAbierto)} title={filtroAbierto === "ventas" ? "Periodo de ventas" : "Vista de agenda"} onClose={() => setFiltroAbierto("")} footer={<button className="bm-primary" onClick={() => setFiltroAbierto("")}>Aplicar</button>}><p>{filtroAbierto === "ventas" ? "La gráfica está configurada para mostrar el resumen mensual." : "La agenda está configurada para mostrar las citas del día seleccionado."}</p></BarberoModal>
    </section>
  );
}
