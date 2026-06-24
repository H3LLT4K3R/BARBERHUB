import { useState } from "react";
import "../styles/pago-anticipo.css";

export default function PagoAnticipo() {
  // Estados para capturar los datos del formulario de pago
  const [formData, setFormData] = useState({
    numeroTarjeta: "",
    nombreTarjeta: "",
    fechaVencimiento: "",
    cvc: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConfirmar = (e) => {
    e.preventDefault();
    console.log("Enviando datos de reserva al backend:", formData);
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

          <h1 className="pa-title">Datos de Reserva</h1>
          <p className="pa-subtitle">
            Completa el pago del anticipo <strong>($100MXN)</strong> para asegurar tu cita.
          </p>

          {/* Formulario Interactivo */}
          <form onSubmit={handleConfirmar} className="pa-form">
            
            <div className="pa-input-group">
              <input
                type="text"
                name="numeroTarjeta"
                placeholder="Número de la Tarjeta"
                value={formData.numeroTarjeta}
                onChange={handleChange}
                required
                className="pa-input-field"
              />
            </div>

            <div className="pa-input-group">
              <input
                type="text"
                name="nombreTarjeta"
                placeholder="Nombre en la Tarjeta"
                value={formData.nombreTarjeta}
                onChange={handleChange}
                required
                className="pa-input-field"
              />
            </div>

            {/* Fila Doble para Fecha y CVC */}
            <div className="pa-form-row">
              <div className="pa-input-group pa-flex-1">
                <input
                  type="text"
                  name="fechaVencimiento"
                  placeholder="Fecha de Vencimiento MM/AA"
                  value={formData.fechaVencimiento}
                  onChange={handleChange}
                  required
                  className="pa-input-field"
                />
              </div>
              
              <div className="pa-input-group pa-flex-1">
                <input
                  type="password"
                  name="cvc"
                  placeholder="CVC/CVV"
                  maxLength="4"
                  value={formData.cvc}
                  onChange={handleChange}
                  required
                  className="pa-input-field"
                />
              </div>
            </div>

            {/* Caja de Detalles del Establecimiento y Costos */}
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
              >
                Cancelar
              </button>
              
              <button 
                type="submit" 
                className="pa-btn pa-btn-confirm"
              >
                Confirmar Cita
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}