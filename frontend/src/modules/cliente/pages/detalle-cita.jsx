import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, Clock, MapPin, DollarSign, ArrowLeft, FileText, Shield, CheckCircle, Printer } from "lucide-react";
import "../styles/detalle-cita.css";

const ESTADOS_LABELS = {
  confirmada: "Confirmada",
  pendiente: "Pendiente",
  cancelada: "Cancelada",
  completada: "Completada",
  rechazada: "Rechazada",
};

export default function DetalleCita() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const cita = state?.cita;

  if (!cita) {
    return (
      <div className="dc-pagina">
        <div className="dc-contenido">
          <div className="dc-tarjeta-error">
            <div className="dc-icono-error">⚠️</div>
            <h2 className="dc-titulo-error">Cita no encontrada</h2>
            <p className="dc-texto-error">No se pudo cargar la información de esta cita.</p>
            <button className="dc-boton-principal" onClick={() => navigate("/mis-citas")}>
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
    const codigo = `CITA-${String(cita.id).padStart(8, "0")}-${cita.fecha?.replace(/-/g, "")}`;
    return codigo;
  };

  return (
    <div className="dc-pagina">
      <div className="dc-contenido">
        <button className="dc-boton-volver" onClick={() => navigate("/mis-citas")}>
          <ArrowLeft size={18} />
          Volver a Mis Citas
        </button>

        <div className="dc-tarjeta">
          {/* ENCABEZADO */}
          <div className="dc-encabezado">
            <div className="dc-encabezado-icono">
              <CalendarDays size={32} />
            </div>
            <div>
              <h1 className="dc-titulo">Detalle de Cita</h1>
              <p className="dc-subtitulo">Información completa de tu reserva</p>
            </div>
            <span className={`dc-insignia dc-insignia--${cita.estado}`}>
              {ESTADOS_LABELS[cita.estado] ?? cita.estado}
            </span>
          </div>

          {/* INFO PRINCIPAL */}
          <div className="dc-seccion">
            <h2 className="dc-seccion-titulo">
              <FileText size={18} />
              Información de la Cita
            </h2>
            <div className="dc-grid-info">
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Establecimiento</span>
                <span className="dc-dato-valor dc-dato-valor--grande">{cita.establecimiento}</span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Servicio</span>
                <span className="dc-dato-valor">{cita.servicio}</span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Fecha</span>
                <span className="dc-dato-valor">
                  <CalendarDays size={14} className="dc-icono-fecha" />
                  {formatearFecha(cita.fecha)}
                </span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Horario</span>
                <span className="dc-dato-valor dc-dato-valor--hora">
                  <Clock size={16} />
                  {cita.hora}
                </span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Precio</span>
                <span className="dc-dato-valor dc-dato-valor--precio">
                  <DollarSign size={16} />
                  ${cita.precio} {cita.moneda}
                </span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Dirección</span>
                <span className="dc-dato-valor">
                  <MapPin size={14} className="dc-icono-direccion" />
                  {cita.direccion || cita.establecimiento}
                </span>
              </div>
            </div>
          </div>

          {/* DATOS DEL CLIENTE */}
          {cita.nombre && (
            <div className="dc-seccion">
              <h2 className="dc-seccion-titulo">
                <Shield size={18} />
                Datos de contacto
              </h2>
              <div className="dc-grid-info dc-grid-info--2col">
                <div className="dc-dato">
                  <span className="dc-dato-etiqueta">Nombre</span>
                  <span className="dc-dato-valor">{cita.nombre}</span>
                </div>
                <div className="dc-dato">
                  <span className="dc-dato-etiqueta">Teléfono</span>
                  <span className="dc-dato-valor">{cita.telefono}</span>
                </div>
              </div>
            </div>
          )}

          {/* CÓDIGO DE CONFIRMACIÓN QR */}
          <div className="dc-seccion dc-seccion--qr">
            <h2 className="dc-seccion-titulo">
              <CheckCircle size={18} />
              Código de confirmación
            </h2>
            <div className="dc-qr-caja">
              <div className="dc-qr-codigo">
                {generarQR()}
              </div>
              <div className="dc-qr-detalle">
                <p className="dc-qr-titulo">Código único de cita</p>
                <p className="dc-qr-descripcion">
                  Presenta este código en la barbería para confirmar tu asistencia.
                  También puedes mostrarlo desde tu perfil.
                </p>
              </div>
            </div>
          </div>

          {/* ACCIONES */}
          <div className="dc-acciones">
            <button className="dc-boton-secundario" onClick={() => navigate("/mis-citas")}>
              Volver a Mis Citas
            </button>
            <button className="dc-boton-principal" onClick={() => window.print()}>
              <Printer size={16} />
              Imprimir / Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}