import { useState } from "react";
import {
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  ChevronDown,
  User,
  MoreHorizontal,
  Star,
  Clock,
  Check,
  MessageCircle,
  Scissors,
  Repeat,
  ShoppingBag
} from "lucide-react";
import "../../styles/barbero/dashboard-barbero.css";
import BarberoModal from "./barbero-modal";

const metricas = [
  { etiqueta: "Reseñas", valor: "4.9", icono: Star, tono: "gold" },
  { etiqueta: "Nuevos Clientes", valor: "2", icono: User, tono: "ink" }, 
  { etiqueta: "Agendadas", valor: "6", icono: CalendarDays, tono: "rose" },
  { etiqueta: "Canceladas", valor: "0", icono: CalendarX2, tono: "gray" },
  { etiqueta: "Atendidos", valor: "4", icono: CheckCircle2, tono: "green" },
];

// Base de datos de citas actualizada con datos comerciales prácticos
const citas = [
  { hora: "10:00", cliente: "Laura Martínez", servicio: "Shave & Haircut", importe: "$150", estado: "confirmada", tipo: "cita", visitas: 12, preferencias: "Corte simétrico", frecuencia: "Cada mes", ultimaCompra: "Ninguna", telefono: "+52 555 123 4567" },
  { hora: "11:30", cliente: "Carlos Ruiz", servicio: "Corte clásico", importe: "$180", estado: "pendiente", tipo: "cita", visitas: 4, preferencias: "Fade medio, textura arriba", frecuencia: "Cada 3 semanas", ultimaCompra: "Cera Mate Texturizante", telefono: "+52 555 987 6543" },
  { hora: "13:00", cliente: "Miguel Torres", servicio: "Corte + barba", importe: "$320", estado: "confirmada", tipo: "cita", visitas: 25, preferencias: "Barba cuadrada, rebajar volumen", frecuencia: "Cada 15 días", ultimaCompra: "Aceite para barba (Sándalo)", telefono: "+52 555 246 8135" },
  { hora: "14:00", cliente: "Horario de Comida", servicio: "Descanso", importe: "-", estado: "bloqueado", tipo: "bloqueo" },
  { hora: "16:00", cliente: "Andrés López", servicio: "Perfilado de barba", importe: "$220", estado: "neutral", tipo: "cita", visitas: 3, preferencias: "Solo alinear contornos", frecuencia: "Eventual", ultimaCompra: "Aftershave", telefono: "+52 555 369 2580" },
];

const historialCortes = [
  { id: 1, horaFin: "09:45 AM", cliente: "Roberto Gómez", servicio: "Fade clásico", total: "$180", propina: "$20", metodo: "Tarjeta" },
  { id: 2, horaFin: "08:30 AM", cliente: "David Silva", servicio: "Corte niño", total: "$120", propina: "$0", metodo: "Efectivo" },
];

const dias = ["Lun 26", "Mar 27", "Mié 28", "Jue 29", "Vie 30", "Sáb 01"];

export default function DashboardBarbero() {
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [historialSeleccionado, setHistorialSeleccionado] = useState(null);
  const [verAgenda, setVerAgenda] = useState(false);
  const [diaActivo, setDiaActivo] = useState(0);
  const [filtroAbierto, setFiltroAbierto] = useState("");

  const proximoCliente = citas[1]; 

  return (
    <section className="bd-dashboard">
      <header className="bd-heading">
        <div>
          <p className="bd-eyebrow">Panel barbero</p>
          <h2>Mi jornada</h2>
          <p>Resumen de tus turnos y clientes de hoy.</p>
        </div>
        <button className="bd-date-button" type="button" onClick={() => setVerAgenda(true)}>
          <CalendarDays size={17} /> Lunes, 26 mayo 2026 <ChevronDown size={16} />
        </button>
      </header>

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
        {/* NUEVO DISEÑO: PANEL DE PRÓXIMO CLIENTE */}
        <article className="bd-panel bd-sales-panel" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
          <div className="bd-panel-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '15px' }}>
            <div>
              <p className="bd-panel-kicker" style={{ color: '#3b82f6', fontWeight: '600' }}>En 15 minutos</p>
              <h3 style={{ fontSize: '1.1rem' }}>Siguiente Turno</h3>
            </div>
            <span style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {proximoCliente.hora}
            </span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Cabecera del cliente */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ width: '55px', height: '55px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <User size={28} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', fontWeight: '700' }}>{proximoCliente.cliente}</h4>
                <span style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: '500' }}>
                  <Scissors size={14} /> {proximoCliente.servicio}
                </span>
              </div>
            </div>

            {/* Badges / Etiquetas rápidas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Star size={12} /> {proximoCliente.visitas} Visitas
              </span>
              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Repeat size={12} /> {proximoCliente.frecuencia}
              </span>
            </div>

            {/* Tarjeta de notas comerciales */}
            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px dashed #cbd5e1', flex: 1 }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>Notas de estilo:</strong> 
                {proximoCliente.preferencias}
              </p>
              <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <ShoppingBag size={16} style={{ color: '#d97706', marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.8rem', color: '#b45309', display: 'block' }}>Oportunidad de venta:</strong>
                  <span style={{ fontSize: '0.85rem', color: '#92400e' }}>Última compra: {proximoCliente.ultimaCompra}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button 
              style={{ padding: '12px', backgroundColor: '#f1f5f9', color: '#0f172a', borderRadius: '8px', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => alert(`Abriendo chat con ${proximoCliente.cliente}`)}
              title="Contactar al cliente"
            >
              <MessageCircle size={20} />
            </button>
            <button style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', color: 'white', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
              Comenzar Servicio
            </button>
          </div>
        </article>

        {/* PANEL DE AGENDA */}
        <article className="bd-panel bd-agenda-panel">
          <div className="bd-panel-header">
            <div>
              <p className="bd-panel-kicker">Organización</p>
              <h3>Próximos turnos</h3>
            </div>
            <button type="button" className="bd-select" onClick={() => setFiltroAbierto("agenda")}>
              Agenda <ChevronDown size={15} />
            </button>
          </div>
          <div className="bd-days">
            {dias.map((dia, index) => (
              <button type="button" className={index === diaActivo ? "active" : ""} onClick={() => setDiaActivo(index)} key={dia}>
                {dia}
              </button>
            ))}
          </div>
          <div className="bd-appointments">
            {citas.map((cita) => (
              <div 
                className={`bd-appointment ${cita.tipo === 'bloqueo' ? 'bd-appointment--blocked' : `bd-appointment--${cita.estado}`}`} 
                key={`${cita.hora}-${cita.cliente}`}
                style={cita.tipo === 'bloqueo' ? { backgroundColor: '#f8fafc', opacity: 0.7 } : {}}
              >
                <time>{cita.hora}</time>
                <div>
                  <strong>{cita.cliente} {cita.tipo !== 'bloqueo' && <span>·</span>} {cita.servicio}</strong>
                  <small>{cita.importe}</small>
                </div>
                {cita.tipo !== 'bloqueo' && (
                  <button type="button" onClick={() => setCitaSeleccionada(cita)} aria-label={`Más opciones`}>
                    <MoreHorizontal size={19} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* SECCIÓN: HISTORIAL DE CORTES */}
      <section className="bd-promotions" style={{ marginTop: '2rem' }}>
        <div className="bd-promotions-heading">
          <div>
            <p className="bd-eyebrow">Registro de hoy</p>
            <h3>Historial de cortes terminados</h3>
          </div>
          <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '600' }}>{historialCortes.length} completados</span>
        </div>
        
        <div className="bd-promotion-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {historialCortes.map((registro) => (
            <article 
              className="bd-promotion" 
              role="button" 
              tabIndex="0" 
              onClick={() => setHistorialSeleccionado(registro)} 
              key={registro.id}
              style={{ borderLeft: '4px solid #10b981', padding: '1rem', backgroundColor: 'white' }}
            >
              <div className="bd-promotion-image" style={{ width: '42px', height: '42px', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '50%' }}>
                <Check size={20} />
              </div>
              <div className="bd-promotion-content" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <h4 style={{ color: '#0f172a' }}>{registro.cliente}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}><Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/>{registro.horaFin}</span>
                </div>
                <p style={{ color: '#475569' }}>{registro.servicio}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Propina: <strong style={{ color: '#059669' }}>{registro.propina}</strong></span>
                  <strong style={{ color: '#0f172a' }}>{registro.total}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MODAL DE CITA ACTUALIZADO */}
      <BarberoModal 
        open={Boolean(citaSeleccionada)} 
        title="Detalles del turno" 
        onClose={() => setCitaSeleccionada(null)} 
        footer={
          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button className="bm-secondary" style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#0f172a', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }} onClick={() => setCitaSeleccionada(null)}>
              Marcar No-Show
            </button>
            <button className="bm-primary" style={{ flex: 2, backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }} onClick={() => setCitaSeleccionada(null)}>
              Comenzar Servicio
            </button>
          </div>
        }
      >
        <div style={{ textAlign: 'center', margin: '10px 0 20px 0' }}>
          <div style={{ width: '60px', height: '60px', backgroundColor: '#f1f5f9', borderRadius: '50%', margin: '0 auto 10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <User size={30} />
          </div>
          <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem' }}>{citaSeleccionada?.cliente}</h3>
          <p style={{ margin: 0, color: '#64748b', fontWeight: '500' }}>{citaSeleccionada?.servicio} — {citaSeleccionada?.hora}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Visitas</span>
            <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{citaSeleccionada?.visitas}</strong>
          </div>
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Frecuencia</span>
            <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{citaSeleccionada?.frecuencia}</strong>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
          <p style={{ margin: '0 0 8px 0', color: '#0f172a' }}><strong>Notas del corte:</strong> {citaSeleccionada?.preferencias}</p>
          <p style={{ margin: '0 0 0 0', color: '#0f172a' }}><strong>Última compra:</strong> <span style={{ color: '#d97706', fontWeight: '500' }}>{citaSeleccionada?.ultimaCompra}</span></p>
        </div>

        <button 
          style={{ width: '100%', padding: '12px', backgroundColor: 'white', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: '600', cursor: 'pointer' }}
          onClick={() => alert(`Llamando / Escribiendo a: ${citaSeleccionada?.telefono}`)}
        >
          <MessageCircle size={18} /> Enviar mensaje al cliente
        </button>
      </BarberoModal>

      {/* MODAL DE HISTORIAL */}
      <BarberoModal 
        open={Boolean(historialSeleccionado)} 
        title="Comprobante de servicio" 
        onClose={() => setHistorialSeleccionado(null)} 
        footer={<button className="bm-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '600', cursor: 'pointer' }} onClick={() => setHistorialSeleccionado(null)}>Cerrar comprobante</button>}
      >
        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 8px 0' }}><span style={{ color: '#64748b' }}>Cliente:</span> <strong style={{ float: 'right' }}>{historialSeleccionado?.cliente}</strong></p>
          <p style={{ margin: '0 0 8px 0' }}><span style={{ color: '#64748b' }}>Servicio:</span> <strong style={{ float: 'right' }}>{historialSeleccionado?.servicio}</strong></p>
          <p style={{ margin: '0 0 8px 0' }}><span style={{ color: '#64748b' }}>Hora de fin:</span> <strong style={{ float: 'right' }}>{historialSeleccionado?.horaFin}</strong></p>
          <hr style={{ margin: '15px 0', borderColor: '#e2e8f0' }} />
          <p style={{ margin: '0 0 8px 0' }}><span style={{ color: '#64748b' }}>Método:</span> <strong style={{ float: 'right' }}>{historialSeleccionado?.metodo}</strong></p>
          <p style={{ margin: '0 0 8px 0' }}><span style={{ color: '#64748b' }}>Propina:</span> <strong style={{ float: 'right', color: '#10b981' }}>{historialSeleccionado?.propina}</strong></p>
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>Total cobrado</span>
            <strong style={{ fontSize: '1.3rem', color: '#0f172a' }}>{historialSeleccionado?.total}</strong>
          </div>
        </div>
      </BarberoModal>

      <BarberoModal open={verAgenda} title="Agenda del día" onClose={() => setVerAgenda(false)} footer={<button className="bm-primary" onClick={() => setVerAgenda(false)}>Volver al panel</button>}>
        <p>Estás consultando la agenda del lunes 26 de mayo de 2026.</p>
        <p>Tienes {citas.filter(c => c.tipo === 'cita').length} citas programadas para hoy.</p>
      </BarberoModal>

      <BarberoModal open={Boolean(filtroAbierto)} title="Configuración" onClose={() => setFiltroAbierto("")} footer={<button className="bm-primary" onClick={() => setFiltroAbierto("")}>Aplicar</button>}>
        <p>Opciones de configuración de vista.</p>
      </BarberoModal>
    </section>
  );
}