import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconCircleCheck } from "@tabler/icons-react";
import { BARBERIA_DEMO } from "../data/barberia-demo";
import { apiFetch } from "../../../utils/api.js";
import { formatearHorarioCita, keyAFecha } from "../../../utils/fecha.js";
import PageNavbar from "../components/page-navbar";
import "../styles/datos-reserva.css";

/* Datos demo de reserva*/
const RESERVA_DEMO = {
  establecimiento: BARBERIA_DEMO.nombre,
  servicio: BARBERIA_DEMO.servicio,
  precio: BARBERIA_DEMO.precioEstimado,
  moneda: BARBERIA_DEMO.moneda,
  fecha: "2026-05-21",
  hora: "09:00",
};

/* Componente principal: Datos de Reserva */
export default function DatosReserva() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Datos de la reserva: se toman del state o del demo
  const reserva = {
    barberiaId: state?.barberiaId ?? "urban-cuts",
    establecimiento: state?.establecimiento ?? RESERVA_DEMO.establecimiento,
    servicio: state?.servicio ?? RESERVA_DEMO.servicio,
    precio: state?.precio ?? RESERVA_DEMO.precio,
    moneda: state?.moneda ?? RESERVA_DEMO.moneda,
    fecha: state?.fecha ?? RESERVA_DEMO.fecha,
    hora: state?.hora ?? RESERVA_DEMO.hora,
  };

  const fechaObj = keyAFecha(reserva.fecha);
  const horarioTexto = formatearHorarioCita(fechaObj, reserva.hora);

  // Estados locales
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // Acción: confirmar cita
  const confirmar = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setError("Completa tu nombre y teléfono para confirmar la cita.");
      return;
    }

    setEnviando(true);
    setError("");

    try {
      await apiFetch("/citas", {
        method: "POST",
        body: JSON.stringify({
          barberiaId: reserva.barberiaId,
          establecimiento: reserva.establecimiento,
          servicio: reserva.servicio,
          precio: reserva.precio,
          moneda: reserva.moneda,
          fecha: reserva.fecha,
          hora: reserva.hora,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
        }),
      });

      navigate("/cita-confirmada", {
        state: {
          ...reserva,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
        },
      });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  };

  return (
    <div className="dr-pagina">
      <PageNavbar />
      <div className="dr-contenido">
        <div className="dr-tarjeta">

          {/* Icono superior */}
          <div className="dr-icono" aria-hidden>
            <IconCircleCheck size={48} stroke={2} color="#fff" />
          </div>

          {/* Título y subtítulo */}
          <h1 className="dr-titulo">Datos de Reserva</h1>
          <p className="dr-subtitulo">
            No necesitas cuenta. Completa los datos para agendar en el local.
          </p>

          {/* Formulario */}
          <form className="dr-formulario" onSubmit={confirmar}>
            <input
              className="dr-input"
              type="text"
              placeholder="Tu Nombre Completo"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setError("");
              }}
              required
            />
            <input
              className="dr-input"
              type="tel"
              placeholder="Teléfono / WhatsApp"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                setError("");
              }}
              required
            />

            {/* Resumen de la cita */}
            <div className="dr-resumen">
              <div className="dr-fila-resumen">
                <span className="dr-etiqueta">ESTABLECIMIENTO</span>
                <span className="dr-valor">{reserva.establecimiento}</span>
              </div>
              <div className="dr-fila-resumen">
                <span className="dr-etiqueta">HORARIO</span>
                <span className="dr-valor">{horarioTexto}</span>
              </div>
              <div className="dr-fila-resumen">
                <span className="dr-etiqueta">SERVICIO</span>
                <span className="dr-valor">{reserva.servicio}</span>
              </div>
              <div className="dr-fila-resumen destacado">
                <span className="dr-etiqueta">TOTAL ESTIMADO</span>
                <span className="dr-valor">
                  ${reserva.precio} {reserva.moneda}
                </span>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && <p className="dr-error">{error}</p>}

            {/* Botones de acción */}
            <div className="dr-acciones">
              <button
                type="button"
                className="dr-boton-cancelar"
                onClick={() => navigate("/agenda-local")}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="dr-boton-confirmar"
                disabled={enviando}
              >
                {enviando ? "Confirmando..." : "Confirmar Cita"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}