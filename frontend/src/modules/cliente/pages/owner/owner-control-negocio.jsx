import { useEffect, useState } from 'react';
import { Link as LinkIcon, Send, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { supabase } from '../../../../lib/supabase.js';
import { apiFetch } from '../../../../utils/api.js';
import '../../styles/owner/owner-control.css';

const ETIQUETA_SUSCRIPCION = {
  sin_suscripcion: 'Todavía no tienes una suscripción configurada.',
  pendiente: 'Falta que autorices el cobro mensual.',
  activa: 'Tu suscripción está activa.',
  pausada: 'Tu suscripción está pausada.',
  cancelada: 'Tu suscripción fue cancelada.',
};

export default function ControlNegocioView() {
  const [barberiaId, setBarberiaId] = useState(null);
  const [linkPago, setLinkPago] = useState('');
  const [estadoEnvio, setEstadoEnvio] = useState('idle');
  const [cargando, setCargando] = useState(true);
  const [solicitud, setSolicitud] = useState(null);
  const [suscripcion, setSuscripcion] = useState(null);

  const cargarEstadoSolicitud = async (bid) => {
    const data = await apiFetch(`/estado-link/${bid}`);
    setSolicitud(data);
  };

  const cargarSuscripcion = async () => {
    try {
      const data = await apiFetch('/suscripciones/mia');
      setSuscripcion(data);
    } catch {
      setSuscripcion(null);
    }
  };

  useEffect(() => {
    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: membership } = await supabase
        .from('barberia_memberships')
        .select('barberia_id')
        .eq('profile_id', uid)
        .eq('role', 'owner')
        .eq('is_active', true)
        .maybeSingle();

      setBarberiaId(membership?.barberia_id ?? null);
      if (membership?.barberia_id) {
        await cargarEstadoSolicitud(membership.barberia_id);
        await cargarSuscripcion();
      }
      setCargando(false);
    }

    cargar();
  }, []);

  const enviarARevision = async (e) => {
    e.preventDefault();
    if (!linkPago.includes('mercadopago') && !linkPago.includes('mpago')) {
      alert('Por favor ingresa un link válido de Mercado Pago (que contenga mercadopago o mpago.la).');
      return;
    }
    if (!barberiaId) return;

    setEstadoEnvio('loading');
    try {
      await apiFetch('/solicitar', {
        method: 'POST',
        body: JSON.stringify({ barberiaId, link: linkPago }),
      });
      setEstadoEnvio('success');
      setLinkPago('');
      await cargarEstadoSolicitud(barberiaId);
    } catch (error) {
      console.error('Fallo la conexión con el servidor:', error);
      setEstadoEnvio('error');
    }
  };

  if (cargando) {
    return <div className="control-wrapper"><p>Cargando...</p></div>;
  }

  if (!barberiaId) {
    return <div className="control-wrapper"><p>Solo el dueño de la barbería puede acceder a esta sección.</p></div>;
  }

  return (
    <div className="control-wrapper fade-in">
      <div className="control-header-main">
        <h2>Control de Negocio</h2>
        <p>Configuración general y métodos de cobro de la sucursal.</p>
      </div>

      {suscripcion && suscripcion.subscription_status !== 'sin_suscripcion' && (
        <div className="control-card">
          <div className="card-header-border">
            <h3>
              <CreditCard className="icon-gold" size={24} />
              Suscripción de la Plataforma
            </h3>
            <p>{ETIQUETA_SUSCRIPCION[suscripcion.subscription_status]}</p>
          </div>

          {suscripcion.subscription_status === 'activa' && (
            <div className="status-banner banner-success">
              <CheckCircle size={20} className="banner-icon" />
              <div className="banner-text">
                <strong>Suscripción activa · ${suscripcion.subscription_amount} MXN/mes</strong>
                {suscripcion.subscription_next_payment && (
                  <span>Próximo cobro: {new Date(suscripcion.subscription_next_payment).toLocaleDateString('es-MX')}</span>
                )}
              </div>
            </div>
          )}

          {suscripcion.subscription_status === 'pendiente' && suscripcion.initPoint && (
            <div className="status-banner">
              <div className="banner-text">
                <strong>Autoriza tu cobro mensual de ${suscripcion.subscription_amount} MXN.</strong>
                <span>
                  <a href={suscripcion.initPoint} target="_blank" rel="noreferrer">Autorizar con Mercado Pago</a>
                </span>
              </div>
            </div>
          )}

          {(suscripcion.subscription_status === 'pausada' || suscripcion.subscription_status === 'cancelada') && (
            <div className="status-banner banner-error">
              <AlertCircle size={20} className="banner-icon" />
              <div className="banner-text">
                <strong>Tu suscripción no está activa.</strong>
                <span>Contacta a soporte para reactivarla.</span>
              </div>
            </div>
          )}

          {suscripcion.is_suspended && (
            <div className="status-banner banner-error">
              <AlertCircle size={20} className="banner-icon" />
              <div className="banner-text">
                <strong>Tu barbería está suspendida.</strong>
                <span>No aparece en Explorar hasta que se reactive.</span>
              </div>
            </div>
          )}
        </div>
      )}

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

        {solicitud?.estado === 'approved' && (
          <div className="status-banner banner-success">
            <CheckCircle size={20} className="banner-icon" />
            <div className="banner-text">
              <strong>Tu link ya está aprobado y activo.</strong>
              <span>{solicitud.link}</span>
            </div>
          </div>
        )}
        {solicitud?.estado === 'pending_review' && (
          <div className="status-banner">
            <div className="banner-text">
              <strong>Tu solicitud sigue en revisión.</strong>
              <span>{solicitud.link}</span>
            </div>
          </div>
        )}
        {solicitud?.estado === 'rejected' && (
          <div className="status-banner banner-error">
            <AlertCircle size={20} className="banner-icon" />
            <div className="banner-text">
              <strong>Tu solicitud fue rechazada.</strong>
              <span>Puedes enviar un nuevo link para revisión.</span>
            </div>
          </div>
        )}
        {solicitud?.estado === 'disabled' && (
          <div className="status-banner banner-error">
            <AlertCircle size={20} className="banner-icon" />
            <div className="banner-text">
              <strong>Tu link de cobro fue desactivado.</strong>
              <span>Contacta a soporte o envía uno nuevo para revisión.</span>
            </div>
          </div>
        )}

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

            <button type="submit" disabled={estadoEnvio === 'loading' || !linkPago.trim()} className="btn-submit">
              {estadoEnvio === 'loading' ? (
                <span className="btn-content"><span className="spinner"></span>Enviando...</span>
              ) : (
                <span className="btn-content"><Send size={16} /> Enviar a Auditar</span>
              )}
            </button>
          </div>

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
