import { useState } from "react";
import "../styles/pago-anticipo.css";

export default function PagoAnticipo() {
  const [enviando, setEnviando] = useState(false);

  const handleConfirmar = (e) => {
    e.preventDefault();
    setEnviando(true);
    console.log("Redirigiendo a la pasarela externa de Mercado Pago...");
    
    // Aquí puedes meter tu lógica de redirección con el SDK o link de Mercado Pago
    setTimeout(() => {
      setEnviando(false);
    }, 2000);
  };

  const handleCancelar = () => {
    console.log("Reserva cancelada, redirigiendo...");
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

      {/* Zona Central sin Sidebars */}
      <main className="pa-content-layout">
        <div className="pa-reserva-card">
          
          {/* Icono de Check de Éxito superior */}
          <div className="pa-icon-badge">
            <span className="pa-check-mark">✓</span>
          </div>

          <h1 className="pa-title">Pago de Anticipo</h1>
          <p className="pa-subtitle">
            Completa el pago del anticipo utilizando **Mercado Pago** para asegurar tu cita. El resto se liquidará en el local.
          </p>

          {/* Formulario que conecta con Mercado Pago */}
          <form onSubmit={handleConfirmar} className="pa-form">
            
            {/* Aviso informativo de Mercado Pago */}
            <div className="pa-mp-notice-box">
              <span className="pa-mp-icon">💳</span>
              <p className="pa-mp-text">
                Al hacer clic en continuar, abrirás de forma segura la pasarela de <strong>Mercado Pago</strong> para realizar el abono correspondiente.
              </p>
            </div>

            {/* Caja de Detalles del Establecimiento y Costos (Exactamente la tuya) */}
            <div className="pa-summary-box">
              <div className="pa-summary-item">
                <span className="pa-label">ESTABLECIMIENTO</span>
                <span className="pa-value font-bold">Urban Cuts</span>
              </div>
              <div className="pa-summary-item">
                <span className="pa-label">HORARIO</span>
                <span className="pa-value font-bold">Jueves a las 9:00 hrs</span>
              </div>
              <div className="pa-summary-item">
                <span className="pa-label">SERVICIO</span>
                <span className="pa-value">Corte y barba</span>
              </div>
              <div className="pa-summary-item">
                <span className="pa-label">TOTAL ESTIMADO</span>
                <span className="pa-value font-bold">$350 MXN</span>
              </div>
              <div className="pa-summary-item pa-highlight-row">
                <span className="pa-label">ANTICIPO A PAGAR</span>
                <span className="pa-value font-bold">$100 MXN</span>
              </div>
            </div>

            {/* Botones de Acción */}
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
                {enviando ? "Abriendo Mercado Pago..." : "Pagar con Mercado Pago"}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}