import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, MapPin, DollarSign, ArrowLeft, FileText, Shield, CheckCircle, Printer } from "lucide-react";
import "../styles/detalle-cita.css";

export default function DetalleCita() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const cita = state?.cita;

  if (!cita) {
    return (
      <div className="dc-page">
        <div className="dc-body">
          <div className="dc-error-card">
            <div className="dc-error-icon">⚠️</div>
            <h2 className="dc-error-title">Cita no encontrada</h2>
            <p className="dc-error-text">No se pudo cargar la información de esta cita.</p>
            <button className="dc-btn-primary" onClick={() => navigate("/mis-citas")}>
              Volver a Mis Citas
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatearFecha = (fechaStr) => {
    try {
      const [year, month, day] = fechaStr.split("-");
      const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
      ];
      const fecha = new Date(`${fechaStr}T12:00:00`);
      const diaSemana = dias[fecha.getDay()];
      return `${diaSemana}, ${parseInt(day)} de ${meses[parseInt(month) - 1]} del ${year}`;
    } catch {
      return fechaStr;
    }
  };

  const generarQR = () => {
    const codigo = `CITA-${cita.id?.slice(0, 8)}-${cita.fecha?.replace(/-/g, "")}`;
    return codigo;
  };

  return (
    <div className="dc-page">
      <div className="dc-body">
        <button className="dc-btn-back" onClick={() => navigate("/mis-citas")}>
          <ArrowLeft size={18} />
          Volver a Mis Citas
        </button>

        <div className="dc-card">
          {/* HEADER */}
          <div className="dc-header">
            <div className="dc-header-icon">
              <CalendarDays size={32} />
            </div>
            <div>
              <h1 className="dc-title">Detalle de Cita</h1>
              <p className="dc-subtitle">Información completa de tu reserva</p>
            </div>
            <span className={`dc-badge dc-badge--${cita.estado}`}>
              {cita.estado === "confirmada" ? "Confirmada" : cita.estado}
            </span>
          </div>

          {/* INFO PRINCIPAL */}
          <div className="dc-section">
            <h2 className="dc-section-title">
              <FileText size={18} />
              Información de la Cita
            </h2>
            <div className="dc-info-grid">
              <div className="dc-info-item">
                <span className="dc-info-label">Establecimiento</span>
                <span className="dc-info-value dc-info-value--lg">{cita.establecimiento}</span>
              </div>
              <div className="dc-info-item">
                <span className="dc-info-label">Servicio</span>
                <span className="dc-info-value">{cita.servicio}</span>
              </div>
              <div className="dc-info-item">
                <span className="dc-info-label">Fecha</span>
                <span className="dc-info-value">
                  <CalendarDays size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#c9a227' }} />
                  {formatearFecha(cita.fecha)}
                </span>
              </div>
              <div className="dc-info-item">
                <span className="dc-info-label">Horario</span>
                <span className="dc-info-value dc-info-value--time">
                  <Clock size={16} />
                  {cita.hora}
                </span>
              </div>
              <div className="dc-info-item">
                <span className="dc-info-label">Precio</span>
                <span className="dc-info-value dc-info-value--price">
                  <DollarSign size={16} />
                  ${cita.precio} {cita.moneda}
                </span>
              </div>
              <div className="dc-info-item">
                <span className="dc-info-label">Dirección</span>
                <span className="dc-info-value">
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#b8836f' }} />
                  {cita.direccion || cita.establecimiento}
                </span>
              </div>
            </div>
          </div>

          {/* DATOS DEL CLIENTE */}
          {cita.nombre && (
            <div className="dc-section">
              <h2 className="dc-section-title">
                <Shield size={18} />
                Datos de contacto
              </h2>
              <div className="dc-info-grid dc-info-grid--2col">
                <div className="dc-info-item">
                  <span className="dc-info-label">Nombre</span>
                  <span className="dc-info-value">{cita.nombre}</span>
                </div>
                <div className="dc-info-item">
                  <span className="dc-info-label">Teléfono</span>
                  <span className="dc-info-value">{cita.telefono}</span>
                </div>
              </div>
            </div>
          )}

          {/* CÓDIGO DE CONFIRMACIÓN QR */}
          <div className="dc-section dc-section--qr">
            <h2 className="dc-section-title">
              <CheckCircle size={18} />
              Código de confirmación
            </h2>
            <div className="dc-qr-box">
              <div className="dc-qr-code">
                {generarQR()}
              </div>
              <div className="dc-qr-info">
                <p className="dc-qr-label">Código único de cita</p>
                <p className="dc-qr-desc">
                  Presenta este código en la barbería para confirmar tu asistencia.
                  También puedes mostrarlo desde tu perfil.
                </p>
              </div>
            </div>
          </div>

          {/* ACCIONES */}
          <div className="dc-actions">
            <button className="dc-btn-secondary" onClick={() => navigate("/mis-citas")}>
              Volver a Mis Citas
            </button>
            <button className="dc-btn-primary" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimir / Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}