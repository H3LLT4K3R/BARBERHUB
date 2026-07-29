import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Clock, MapPin, DollarSign, ArrowLeft, FileText, CheckCircle, Printer } from "lucide-react";
import { supabase } from "../../../lib/supabase.js";
import "../styles/detalle-cita.css";

const ESTADOS_LABELS = {
  confirmed: "Confirmada",
  pending_payment: "Pendiente de pago",
  pending_confirmation: "Pendiente",
  in_progress: "En curso",
  cancelled: "Cancelada",
  completed: "Completada",
  rejected: "Rechazada",
  no_show: "No asistió",
};

function formatearFecha(fechaISO) {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const fecha = new Date(fechaISO);
  return `${dias[fecha.getDay()]}, ${fecha.getDate()} de ${meses[fecha.getMonth()]} del ${fecha.getFullYear()}`;
}

export default function DetalleCita() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    supabase
      .from("appointments")
      .select(`
        id, scheduled_at, status, total, confirmation_code,
        barberias(name, address_line1, city, currency_code),
        appointment_services(service_name)
      `)
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelado) return;
        setCita(data);
        setCargando(false);
      });

    return () => { cancelado = true; };
  }, [id]);

  if (cargando) {
    return <div className="dc-pagina"><div className="dc-contenido"><p>Cargando...</p></div></div>;
  }

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

  const fechaObj = new Date(cita.scheduled_at);
  const fechaISO = fechaObj.toISOString().slice(0, 10);
  const hora = fechaObj.toTimeString().slice(0, 5);

  return (
    <div className="dc-pagina">
      <div className="dc-contenido">
        <button className="dc-boton-volver" onClick={() => navigate("/mis-citas")}>
          <ArrowLeft size={18} />
          Volver a Mis Citas
        </button>

        <div className="dc-tarjeta">
          <div className="dc-encabezado">
            <div className="dc-encabezado-icono">
              <CalendarDays size={32} />
            </div>
            <div>
              <h1 className="dc-titulo">Detalle de Cita</h1>
              <p className="dc-subtitulo">Información completa de tu reserva</p>
            </div>
            <span className={`dc-insignia dc-insignia--${cita.status}`}>
              {ESTADOS_LABELS[cita.status] ?? cita.status}
            </span>
          </div>

          <div className="dc-seccion">
            <h2 className="dc-seccion-titulo">
              <FileText size={18} />
              Información de la Cita
            </h2>
            <div className="dc-grid-info">
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Establecimiento</span>
                <span className="dc-dato-valor dc-dato-valor--grande">{cita.barberias?.name}</span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Servicio</span>
                <span className="dc-dato-valor">{cita.appointment_services?.[0]?.service_name ?? "-"}</span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Fecha</span>
                <span className="dc-dato-valor">
                  <CalendarDays size={14} className="dc-icono-fecha" />
                  {formatearFecha(fechaISO)}
                </span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Horario</span>
                <span className="dc-dato-valor dc-dato-valor--hora">
                  <Clock size={16} />
                  {hora}
                </span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Precio</span>
                <span className="dc-dato-valor dc-dato-valor--precio">
                  <DollarSign size={16} />
                  ${cita.total} {cita.barberias?.currency_code}
                </span>
              </div>
              <div className="dc-dato">
                <span className="dc-dato-etiqueta">Dirección</span>
                <span className="dc-dato-valor">
                  <MapPin size={14} className="dc-icono-direccion" />
                  {cita.barberias?.address_line1}, {cita.barberias?.city}
                </span>
              </div>
            </div>
          </div>

          <div className="dc-seccion dc-seccion--qr">
            <h2 className="dc-seccion-titulo">
              <CheckCircle size={18} />
              Código de confirmación
            </h2>
            <div className="dc-qr-caja">
              <div className="dc-qr-codigo">
                {cita.confirmation_code}
              </div>
              <div className="dc-qr-detalle">
                <p className="dc-qr-titulo">Código único de cita</p>
                <p className="dc-qr-descripcion">
                  Presenta este código en la barbería para confirmar tu asistencia.
                </p>
              </div>
            </div>
          </div>

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
