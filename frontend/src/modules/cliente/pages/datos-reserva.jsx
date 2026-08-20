import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconCircleCheck } from "@tabler/icons-react";
import { formatearHorarioCita, keyAFecha } from "../../../utils/fecha.js";
import { supabase } from "../../../lib/supabase.js";
import { useActiveAccountGuard } from "../../../hooks/useActiveAccountGuard";
import PageNavbar from "../components/page-navbar";
import "../styles/datos-reserva.css";

// Anticipo fijo para todas las citas (por ahora); el resto se liquida en el local.
const ANTICIPO_FIJO_MXN = 100;

export default function DatosReserva() {
  useActiveAccountGuard();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");

  // El cliente ya inició sesión para llegar hasta aquí: se jalan sus datos del
  // perfil para no hacerlo escribirlos de nuevo. Se dejan editables por si
  // necesita corregirlos o agendar con un número de contacto distinto.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      const { data: perfil } = await supabase.from("profiles").select("full_name, phone").eq("id", uid).maybeSingle();
      if (cancelado || !perfil) return;
      if (perfil.full_name) setNombre(perfil.full_name);
      if (perfil.phone) setTelefono(perfil.phone);
    })();
    return () => { cancelado = true; };
  }, []);

  if (!state?.barberiaId || !state?.fecha || !state?.hora) {
    return (
      <div className="dr-pagina">
        <PageNavbar />
        <div className="dr-contenido">
          <div className="dr-tarjeta">
            <p>Falta información de la reserva. Vuelve a agendar tu cita.</p>
            <button className="dr-boton-confirmar" onClick={() => navigate("/explorar")}>Ir a explorar</button>
          </div>
        </div>
      </div>
    );
  }

  const reserva = {
    barberiaId: state.barberiaId,
    servicioIdReal: state.servicioIdReal,
    establecimiento: state.establecimiento,
    servicio: state.servicio,
    precio: state.precio,
    moneda: state.moneda ?? "CLP",
    fecha: state.fecha,
    hora: state.hora,
    barberMembershipId: state.barberMembershipId ?? null,
    barberoNombre: state.barberoNombre ?? null,
  };

  const fechaObj = keyAFecha(reserva.fecha);
  const horarioTexto = formatearHorarioCita(fechaObj, reserva.hora);

  const confirmar = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim()) {
      setError("Completa tu nombre y teléfono para confirmar la cita.");
      return;
    }

    navigate("/pago-anticipo", {
      state: {
        ...reserva,
        horario: horarioTexto,
        nombreContacto: nombre.trim(),
        telefonoContacto: telefono.trim(),
      },
    });
  };

  return (
    <div className="dr-pagina">
      <PageNavbar />
      <div className="dr-contenido">
        <div className="dr-tarjeta">
          <div className="dr-icono" aria-hidden>
            <IconCircleCheck size={48} stroke={2} color="#fff" />
          </div>

          <h1 className="dr-titulo">Datos de Reserva</h1>
          <p className="dr-subtitulo">
            Verifica tus datos para agendar en el local y proceder al pago.
          </p>

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
                <span className="dr-valor">{reserva.barberoNombre ?? "Sin preferencia"}</span>
              </div>
              <div className="dr-fila-resumen">
                <span className="dr-etiqueta">TOTAL DEL SERVICIO</span>
                <span className="dr-valor">
                  ${reserva.precio} {reserva.moneda}
                </span>
              </div>
              <div className="dr-fila-resumen destacado">
                <span className="dr-etiqueta">ANTICIPO A PAGAR (al aceptar el barbero)</span>
                <span className="dr-valor destacado-valor">
                  ${ANTICIPO_FIJO_MXN} {reserva.moneda}
                </span>
              </div>
              <div className="dr-fila-resumen">
                <span className="dr-etiqueta">RESTO A PAGAR EN EL LOCAL</span>
                <span className="dr-valor">
                  ${Math.max(0, reserva.precio - ANTICIPO_FIJO_MXN)} {reserva.moneda}
                </span>
              </div>
            </div>

            {error && <p className="dr-error">{error}</p>}

            <div className="dr-acciones">
              <button
                type="button"
                className="dr-boton-cancelar"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </button>
              <button type="submit" className="dr-boton-confirmar">
                Continuar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
