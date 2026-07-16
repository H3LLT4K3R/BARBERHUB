import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Clock,
  Scissors,
  CheckCircle2,
  Phone,
  Star,
  MessageCircle,
  X,
} from "lucide-react";
import "../../styles/barbero/seguimiento-servicio.css";
import BrandLogo from "../../components/brand-logo";
function BarberoNavbar() {
  return (
    <nav className="ss-navbar">
      <BrandLogo className="ss-navbar-logo-btn" imgClassName="ss-navbar-logo-img" />
    </nav>
  );
}

<img src="/barberhublogo.jpg" alt="BarberHub" />

// Datos de demostración para el prototipo.
// En producción esto vendría de la API (la cita real asignada a este barbero).
const citaDemo = {
  servicio: "Corte + Barba — Master Piece",
  fecha: "Domingo, 15 de febrero",
  hora: "08:00 AM",
  cliente: {
    nombre: "Luis Méndez",
    telefono: "+52 55 1234 5678",
    avatar:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop",
    esFrecuente: true,
    visitasPrevias: 6,
  },
  serviciosSeleccionados: [
    { nombre: "Corte básico", detalle: "Corte básico + vitamina" },
    { nombre: "Masaje capilar", detalle: "Masaje extra" },
  ],
};

const pasos = [
  { id: "reserva", label: "Reserva", icon: CalendarCheck },
  { id: "confirmacion", label: "Confirmado", icon: Clock },
  { id: "servicio", label: "En servicio", icon: Scissors },
  { id: "finalizado", label: "Finalizado", icon: CheckCircle2 },
];

// Texto/acción del botón según el paso en el que se encuentra el servicio
const accionesPorPaso = [
  { textoBoton: "Confirmar llegada del cliente" },
  { textoBoton: "Iniciar servicio" },
  { textoBoton: "Finalizar servicio" },
  null, // ya no hay siguiente paso
];

export default function SeguimientoServicio() {
  const navigate = useNavigate();
  const [pasoActual, setPasoActual] = useState(1); // índice del paso activo
  const cita = citaDemo;

  const accion = accionesPorPaso[pasoActual];

  const avanzarPaso = () => {
    setPasoActual((prev) => Math.min(prev + 1, pasos.length - 1));
  };

  return (
    <div className="ss-page">
      <BarberoNavbar />

      <div className="ss-body">
        <h1 className="ss-titulo">Seguimiento del servicio</h1>

        {/* ── STEPPER ── */}
        <div className="ss-stepper">
          {pasos.map((paso, index) => {
            const Icono = paso.icon;
            const completado = index < pasoActual;
            const activo = index === pasoActual;
            return (
              <div className="ss-step" key={paso.id}>
                <div className="ss-step-track">
                  <div
                    className={`ss-step-icon ${
                      completado ? "ss-step-icon--completado" : ""
                    } ${activo ? "ss-step-icon--activo" : ""}`}
                  >
                    <Icono size={20} />
                  </div>
                  {index < pasos.length - 1 && (
                    <div
                      className={`ss-step-line ${
                        completado ? "ss-step-line--completado" : ""
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`ss-step-label ${
                    activo ? "ss-step-label--activo" : ""
                  }`}
                >
                  {paso.label}
                </span>
                <span className="ss-step-anticipo">Anticipo $100</span>
              </div>
            );
          })}
        </div>

        {/* ── TARJETA DE ESTADO ACTUAL ── */}
        <div className="ss-estado-card">
          <img
            className="ss-estado-imagen"
            src={cita.cliente.avatar}
            alt={cita.cliente.nombre}
          />
          <div className="ss-estado-info">
            <h2 className="ss-estado-titulo">{cita.servicio}</h2>
            <p className="ss-estado-direccion">{cita.cliente.nombre}</p>
            {cita.cliente.esFrecuente && (
              <p className="ss-estado-rating">
                <Star size={14} fill="#e5be6b" color="#e5be6b" />
                Cliente frecuente · {cita.cliente.visitasPrevias} visitas
              </p>
            )}
            <div className="ss-estado-acciones">
              <a className="ss-accion-icono" href={`tel:${cita.cliente.telefono}`}>
                <Phone size={16} />
                Llamar
              </a>
              <button className="ss-accion-icono" type="button">
                <MessageCircle size={16} />
                Chat
              </button>
            </div>
          </div>

          <div className="ss-estado-controles">
            {accion && (
              <button
                className="ss-btn-avanzar"
                type="button"
                onClick={avanzarPaso}
              >
                {accion.textoBoton}
              </button>
            )}
            <button
              className="ss-btn-cancelar"
              type="button"
              onClick={() => navigate("/barbero-agenda")}
            >
              <X size={14} />
              Cancelar cita
            </button>
          </div>
        </div>

        {/* ── INFORMACIÓN DETALLADA ── */}
        <div className="ss-detalle-grid">
          <div className="ss-detalle-card">
            <h3 className="ss-detalle-titulo">Cliente</h3>
            <div className="ss-barbero">
              <img
                className="ss-barbero-avatar"
                src={cita.cliente.avatar}
                alt={cita.cliente.nombre}
              />
              <div>
                <p className="ss-barbero-nombre">{cita.cliente.nombre}</p>
                <p className="ss-barbero-rating">
                  <Phone size={13} />
                  {cita.cliente.telefono}
                </p>
              </div>
            </div>
            <div className="ss-barbero-stats">
              <div>
                <span className="ss-stat-label">Tipo</span>
                <span className="ss-stat-valor">
                  {cita.cliente.esFrecuente ? "Frecuente" : "Nuevo"}
                </span>
              </div>
              <div>
                <span className="ss-stat-label">Visitas previas</span>
                <span className="ss-stat-valor">
                  {cita.cliente.visitasPrevias}
                </span>
              </div>
            </div>
          </div>

          <div className="ss-detalle-card">
            <h3 className="ss-detalle-titulo">Fecha y hora</h3>
            <p className="ss-fecha">{cita.fecha}</p>
            <p className="ss-hora">
              <Clock size={16} />
              {cita.hora}
            </p>
          </div>

          <div className="ss-detalle-card">
            <h3 className="ss-detalle-titulo">Servicio a realizar</h3>
            <ul className="ss-servicios-lista">
              {cita.serviciosSeleccionados.map((s) => (
                <li key={s.nombre} className="ss-servicio-item">
                  <Scissors size={15} />
                  <div>
                    <p className="ss-servicio-nombre">{s.nombre}</p>
                    <p className="ss-servicio-detalle">{s.detalle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}