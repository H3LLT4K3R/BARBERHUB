import { useState } from "react";
import "../styles/pago-anticipo.css";

export default function PagoAnticipo({ datosReserva }) {
  const [enviando, setEnviando] = useState(false);

  // Valores dinámicos opcionales con fallback por defecto
  const resumen = datosReserva || {
    establecimiento: "URBAN CUTS",
    horario: "Jueves a las 9:00 hrs",
    servicio: "Corte y barba",
    total: "$350 MXN",
    anticipo: "$100 MXN",
  };

  const handleConfirmar = (e) => {
    e.preventDefault();
    setEnviando(true);
    
    // Simulación de llamado a Backend para crear preferencia Mercado Pago
    setTimeout(() => {
      setEnviando(false);
      // Ejemplo: window.location.href = initPointMercadoPago;
      console.log("Redirigiendo a pasarela Mercado Pago...");
    }, 1800);
  };

  const handleCancelar = () => {
    console.log("Reserva cancelada, regresando a la selección...");
  };

  return (
    <div className="pa-container-page">
      {/* Encabezado Superior */}
      <header className="pa-main-header">
        <div className="pa-brand-header">
          <img src="/barberhublogo.jpg" alt="Barber Hub" className="pa-logo-img" />
          <h2>BARBER HUB</h2>
        </div>
      </header>

      {/* Zona Central */}
      <main className="pa-content-layout">
        <div className="pa-reserva-card">
          
          {/* Badge de Verificación */}
          <div className="pa-icon-badge">
            <span className="pa-check-mark">✓</span>
          </div>

          <h1 className="pa-title">Pago de Anticipo</h1>
          <p className="pa-subtitle">
            Completa el pago del anticipo utilizando <strong>Mercado Pago</strong> para asegurar tu cita. El resto se liquidará directamente en el local.
          </p>

          <form onSubmit={handleConfirmar} className="pa-form">
            
            {/* Aviso Informativo Pasarela */}
            <div className="pa-mp-notice-box">
              <span className="pa-mp-icon">💳</span>
              <p className="pa-mp-text">
                Al hacer clic en continuar, se abrirá la pasarela segura de <strong>Mercado Pago</strong> para completar la transacción.
              </p>
            </div>

            {/* Cuadro Resumen de Reserva */}
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
                <span className="pa-label">TOTAL ESTIMADO</span>
                <span className="pa-value font-bold">{resumen.total}</span>
              </div>
              <div className="pa-summary-item pa-highlight-row">
                <span className="pa-label">ANTICIPO A PAGAR</span>
                <span className="pa-value font-bold">{resumen.anticipo}</span>
              </div>
            </div>

            {/* Acciones */}
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
                {enviando ? "Conectando..." : "Pagar con Mercado Pago"}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}