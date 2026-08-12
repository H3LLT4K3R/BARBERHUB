import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../../utils/api.js";
import "../styles/pago-anticipo.css";

// Anticipo fijo para todas las citas (por ahora); el resto se liquida en el local.
const ANTICIPO_FIJO_MXN = 100;

export default function PagoAnticipo() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [error, setError] = useState("");

  const [codigoCupon, setCodigoCupon] = useState("");
  const [validandoCupon, setValidandoCupon] = useState(false);
  const [cupon, setCupon] = useState(null);
  const [errorCupon, setErrorCupon] = useState("");

  if (!state?.barberiaId || !state?.fecha || !state?.hora) {
    return (
      <div className="pa-container-page">
        <main className="pa-content-layout">
          <div className="pa-reserva-card">
            <p>Falta información de la reserva. Vuelve a agendar tu cita.</p>
            <button className="pa-btn pa-btn-confirm" onClick={() => navigate("/explorar")}>Ir a explorar</button>
          </div>
        </main>
      </div>
    );
  }

  const resumen = {
    establecimiento: state.establecimiento,
    horario: state.horario,
    servicio: state.servicio,
    barbero: state.barberoNombre ?? "Sin preferencia",
    total: `$${state.precio} ${state.moneda}`,
    anticipo: `$${ANTICIPO_FIJO_MXN} ${state.moneda}`,
  };

  const scheduledAt = new Date(`${state.fecha}T${state.hora}:00`).toISOString();

  const aplicarCupon = async () => {
    if (!codigoCupon.trim()) return;
    setValidandoCupon(true);
    setErrorCupon("");
    try {
      const resultado = await apiFetch("/citas/validar-cupon", {
        method: "POST",
        body: JSON.stringify({
          couponCode: codigoCupon.trim().toUpperCase(),
          barberiaId: state.barberiaId,
          barberMembershipId: state.barberMembershipId ?? undefined,
          serviceIds: [state.servicioIdReal],
          scheduledAt,
        }),
      });
      setCupon(resultado);
    } catch (err) {
      setCupon(null);
      setErrorCupon(err.message || "No fue posible validar el cupón.");
    } finally {
      setValidandoCupon(false);
    }
  };

  const quitarCupon = () => {
    setCupon(null);
    setCodigoCupon("");
    setErrorCupon("");
  };

  const handleConfirmar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError("");

    try {
      const clientNote = state.nombreContacto
        ? `Contacto: ${state.nombreContacto} (${state.telefonoContacto})`
        : undefined;

      await apiFetch("/citas", {
        method: "POST",
        body: JSON.stringify({
          barberiaId: state.barberiaId,
          barberMembershipId: state.barberMembershipId ?? undefined,
          serviceIds: [state.servicioIdReal],
          scheduledAt,
          clientNote,
          couponCode: cupon?.codigo,
        }),
      });

      setEnviada(true);
    } catch (err) {
      setError(err.message || "No fue posible enviar tu solicitud. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const handleCancelar = () => {
    navigate(-1);
  };

  if (enviada) {
    return (
      <div className="pa-container-page">
        <header className="pa-main-header">
          <div className="pa-brand-header">
            <img src="/logo.png" alt="Barber Hub" className="pa-logo-img" />
            <h2>BARBER HUB</h2>
          </div>
        </header>

        <main className="pa-content-layout">
          <div className="pa-reserva-card">
            <div className="pa-icon-badge">
              <span className="pa-check-mark">✓</span>
            </div>

            <h1 className="pa-title">Solicitud enviada</h1>
            <p className="pa-subtitle">
              Le avisamos a <strong>{resumen.establecimiento}</strong> sobre tu solicitud para el <strong>{resumen.horario}</strong>.
              En cuanto el barbero la acepte, podrás pagar tu anticipo de <strong>{resumen.anticipo}</strong> desde "Mis Citas" para asegurar tu horario.
            </p>

            <div className="pa-action-buttons">
              <button className="pa-btn pa-btn-confirm" onClick={() => navigate("/mis-citas")}>
                Ver mis citas
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pa-container-page">
      <header className="pa-main-header">
        <div className="pa-brand-header">
          <img src="/logo.png" alt="Barber Hub" className="pa-logo-img" />
          <h2>BARBER HUB</h2>
        </div>
      </header>

      <main className="pa-content-layout">
        <div className="pa-reserva-card">
          <div className="pa-icon-badge">
            <span className="pa-check-mark">✓</span>
          </div>

          <h1 className="pa-title">Confirmar solicitud de cita</h1>
          <p className="pa-subtitle">
            Tu solicitud se enviará al barbero. Una vez que la acepte, te pediremos el pago del anticipo con <strong>Mercado Pago</strong> para asegurar tu horario. El resto se liquida directamente en el local.
          </p>

          <form onSubmit={handleConfirmar} className="pa-form">
            <div className="pa-cupon-box">
              {cupon ? (
                <div className="pa-cupon-aplicado">
                  <span>✅ Cupón <strong>{cupon.codigo}</strong> aplicado {cupon.descripcion ? `— ${cupon.descripcion}` : ""}</span>
                  <button type="button" className="pa-cupon-quitar" onClick={quitarCupon}>Quitar</button>
                </div>
              ) : (
                <div className="pa-cupon-input-row">
                  <input
                    type="text"
                    className="pa-cupon-input"
                    placeholder="¿Tienes un cupón? (opcional)"
                    value={codigoCupon}
                    onChange={(e) => { setCodigoCupon(e.target.value); setErrorCupon(""); }}
                  />
                  <button
                    type="button"
                    className="pa-cupon-aplicar"
                    onClick={aplicarCupon}
                    disabled={validandoCupon || !codigoCupon.trim()}
                  >
                    {validandoCupon ? "Validando..." : "Aplicar"}
                  </button>
                </div>
              )}
              {errorCupon && <p className="pa-cupon-error">{errorCupon}</p>}
            </div>

            <div className="pa-summary-box">
              <div className="pa-summary-item">
                <span className="pa-label">ESTABLECIMIENTO</span>
                <span className="pa-value font-bold">{resumen.establecimiento}</span>
              </div>
              <div className="pa-summary-item">
                <span className="pa-label">HORARIO</span>
                <span className="pa-value font-bold">{resumen.horario}</span>
              </div>
              <div className="pa-summary-item">
                <span className="pa-label">SERVICIO</span>
                <span className="pa-value">{resumen.servicio}</span>
              </div>
              <div className="pa-summary-item">
                <span className="pa-label">BARBERO</span>
                <span className="pa-value">{resumen.barbero}</span>
              </div>
              <div className="pa-summary-item">
                <span className="pa-label">TOTAL DEL SERVICIO (se paga en el local)</span>
                <span className="pa-value" style={cupon ? { textDecoration: "line-through", color: "#8e8e93" } : undefined}>
                  {resumen.total}
                </span>
              </div>
              {cupon && (
                <div className="pa-summary-item">
                  <span className="pa-label">DESCUENTO</span>
                  <span className="pa-value" style={{ color: "#1a7f37" }}>
                    -${cupon.descuento} {state.moneda}
                  </span>
                </div>
              )}
              {cupon && (
                <div className="pa-summary-item">
                  <span className="pa-label">NUEVO TOTAL (se paga en el local)</span>
                  <span className="pa-value font-bold">${cupon.total} {state.moneda}</span>
                </div>
              )}
              <div className="pa-summary-item pa-highlight-row">
                <span className="pa-label">ANTICIPO A PAGAR (cuando se acepte)</span>
                <span className="pa-value font-bold">{resumen.anticipo}</span>
              </div>
            </div>

            {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

            <div className="pa-action-buttons">
              <button
                type="button"
                onClick={handleCancelar}
                className="pa-btn pa-btn-cancel"
                disabled={enviando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="pa-btn pa-btn-confirm"
                disabled={enviando}
              >
                {enviando ? "Enviando..." : "Enviar solicitud"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
