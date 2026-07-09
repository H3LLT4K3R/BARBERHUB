import React, { useState } from 'react';
import { Link as LinkIcon, Send, CheckCircle, AlertCircle } from 'lucide-react';
import '../../styles/owner/owner-control.css'; // <-- Ajusta la ruta según tu proyecto

export default function ControlNegocioView() {
  const [linkPago, setLinkPago] = useState('');
  const [estadoEnvio, setEstadoEnvio] = useState('idle');

  const enviarARevision = async (e) => {
    e.preventDefault();
    if (!linkPago.includes('mercadopago') && !linkPago.includes('mpago')) {
      alert("Por favor ingresa un link válido de Mercado Pago (que contenga mercadopago o mpago.la).");
      return;
    }

    setEstadoEnvio('loading');

    try {
      // 👇 ESTA ES LA CONEXIÓN REAL AL BACKEND
      const respuesta = await fetch('http://localhost:3000/api/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          barberia: 'BarberHub Sucursal 1', // Nombre fijo por ahora, luego puede ser dinámico
          link: linkPago
        })
      });

      if (respuesta.ok) {
        setEstadoEnvio('success');
        setLinkPago(''); 
      } else {
        // Si el backend responde con un error (ej. error 500)
        setEstadoEnvio('error');
      }
    } catch (error) {
      console.error("Fallo la conexión con el servidor:", error);
      setEstadoEnvio('error');
    }
  };

  return (
    <div className="control-wrapper fade-in">
      
      {/* Encabezado Principal */}
      <div className="control-header-main">
        <h2>Control de Negocio</h2>
        <p>Configuración general y métodos de cobro de la sucursal.</p>
      </div>

      {/* Tarjeta de Configuración */}
      <div className="control-card">
        
        <div className="card-header-border">
          <h3>
            <LinkIcon className="icon-gold" size={24} />
            Enlaces de Cobro Externos
          </h3>
          <p>
            Vincula tu link de Mercado Pago para procesar ventas. Por políticas de seguridad corporativa, nuestro equipo validará de forma remota las credenciales del enlace antes de su activación final en el sistema.
          </p>
        </div>

        <form onSubmit={enviarARevision} className="control-form">
          
          <div className="form-row">
            <div className="input-group">
              <label>URL de Checkout (Mercado Pago)</label>
              <input 
                type="url" 
                required
                className="form-input" 
                placeholder="Ej. https://mpago.la/xxxxxx" 
                value={linkPago}
                onChange={(e) => setLinkPago(e.target.value)}
                disabled={estadoEnvio === 'loading'}
              />
            </div>
            
            <button 
              type="submit"
              disabled={estadoEnvio === 'loading' || !linkPago.trim()}
              className="btn-submit"
            >
              {estadoEnvio === 'loading' ? (
                <span className="btn-content">
                  <span className="spinner"></span>
                  Enviando...
                </span>
              ) : (
                <span className="btn-content">
                  <Send size={16} /> Enviar a Auditar
                </span>
              )}
            </button>
          </div>

          {/* Alertas de Estado */}
          {estadoEnvio === 'success' && (
            <div className="status-banner banner-success zoom-in">
              <CheckCircle size={20} className="banner-icon" />
              <div className="banner-text">
                <strong>¡Solicitud de revisión generada!</strong>
                <span>Se ha enviado una alerta automática al centro de soporte corporativo. Evaluaremos el link para asegurar que todo sea correcto y te notificaremos su aprobación.</span>
              </div>
            </div>
          )}

          {estadoEnvio === 'error' && (
            <div className="status-banner banner-error zoom-in">
              <AlertCircle size={20} className="banner-icon" />
              <div className="banner-text">
                <strong>Fallo de comunicación</strong>
                <span>No fue posible registrar la alerta en la empresa central. Verifica tu conexión e intenta enviar el enlace nuevamente.</span>
              </div>
            </div>
          )}
          
        </form>
      </div>
    </div>
  );
}