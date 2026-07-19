import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconCircleCheck } from "@tabler/icons-react";
import { BARBERIA_DEMO } from "../data/barberia-demo";
// import { apiFetch } from "../../../utils/api.js"; // Lo comentamos por ahora
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
    barbero: state?.barbero ?? "Por asignar",
  };

  const fechaObj = keyAFecha(reserva.fecha);
  const horarioTexto = formatearHorarioCita(fechaObj, reserva.hora);

  // Estados locales
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // Acción: confirmar cita y pagar
  const confirmar = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setError("Completa tu nombre y teléfono para confirmar la cita.");
      return;
    }

    setEnviando(true);
    setError("");

    try {
      // 1. SIMULAMOS EL GUARDADO EN BASE DE DATOS (MOCK)
      // Cuando tengas tu backend listo (Supabase/Node), descomentas apiFetch y borras esta promesa
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      
      /* CÓDIGO REAL COMENTADO TEMPORALMENTE
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
      */

      // 2. REDIRECCIÓN A MERCADO PAGO
      // Cambia esta URL por tu link de cobro real de Mercado Pago
      const linkMercadoPago = "https://mpago.la/25hJZFC"; 
      
      // Esto saca al usuario de tu app y lo lleva a pagar
      navigate("/pago-anticipo", {
        state: {
          ...reserva,
          horario: horarioTexto,
          nombre: nombre.trim(),
          telefono: telefono.trim(),
        },
      });

    } catch (err) {
      setError("Ocurrió un error. Intenta de nuevo.");
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
            Verifica tus datos para agendar en el local y proceder al pago.
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
              <div className="dr-fila-resumen">
                <span className="dr-etiqueta">BARBERO</span>
                <span className="dr-valor">{reserva.barbero}</span>
              </div>
              <div className="dr-fila-resumen destacado">
                <span className="dr-etiqueta">TOTAL A PAGAR</span>
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
                {enviando ? "Continuando..." : "Continuar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
