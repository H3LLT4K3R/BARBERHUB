import { useEffect, useRef, useState } from 'react';
import { Link as LinkIcon, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { supabase } from '../../../../lib/supabase.js';
import { apiFetch } from '../../../../utils/api.js';
import '../../styles/owner/owner-control.css';

const ETIQUETA_SUSCRIPCION = {
  sin_suscripcion: 'Todavía no tienes una suscripción activa.',
  pendiente_revision: 'Tu comprobante está en revisión.',
  activa: 'Tu suscripción está activa.',
  pausada: 'Tu suscripción está pausada.',
  cancelada: 'Tu suscripción fue cancelada.',
};

export default function ControlNegocioView() {
  const [barberiaId, setBarberiaId] = useState(null);
  const [linkPago, setLinkPago] = useState('');
  const [guardandoLink, setGuardandoLink] = useState(false);
  const [mensajeLink, setMensajeLink] = useState('');
  const [cargando, setCargando] = useState(true);
  const [suscripcion, setSuscripcion] = useState(null);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [errorComprobante, setErrorComprobante] = useState('');
  const [nombreArchivoComprobante, setNombreArchivoComprobante] = useState('');
  const comprobanteInputRef = useRef(null);

  const cargarLinkPago = async (bid) => {
    const { data } = await supabase.from('barberias').select('payment_link_url').eq('id', bid).maybeSingle();
    setLinkPago(data?.payment_link_url ?? '');
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
        await cargarLinkPago(membership.barberia_id);
        await cargarSuscripcion();
      }
      setCargando(false);
    }

    cargar();
  }, []);

  const guardarLinkPago = async (e) => {
    e.preventDefault();
    if (!barberiaId) return;

    setGuardandoLink(true);
    setMensajeLink('');
    const esBorrado = !linkPago.trim();
    try {
      const { error } = await supabase
        .from('barberias')
        .update({ payment_link_url: linkPago.trim() || null })
        .eq('id', barberiaId);
      if (error) throw error;
      setMensajeLink(esBorrado ? 'Link de pago eliminado correctamente.' : 'Link guardado correctamente.');
    } catch (error) {
      console.error('No fue posible guardar el link de pago:', error);
      setMensajeLink('No fue posible guardar el link. Intenta de nuevo.');
    } finally {
      setGuardandoLink(false);
    }
  };

  const subirComprobanteSuscripcion = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !barberiaId) return;
    setNombreArchivoComprobante(file.name);

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(file.type)) {
      setErrorComprobante('Solo se aceptan imágenes JPG, PNG, WEBP o GIF.');
      setNombreArchivoComprobante('');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorComprobante('La imagen no puede pesar más de 5 MB.');
      setNombreArchivoComprobante('');
      event.target.value = '';
      return;
    }

    setSubiendoComprobante(true);
    setErrorComprobante('');
    try {
      const path = `suscripciones/${barberiaId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('comprobantes').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      await apiFetch(`/suscripciones/${barberiaId}/comprobante`, {
        method: 'POST',
        body: JSON.stringify({ proofPath: path }),
      });

      await cargarSuscripcion();
    } catch (error) {
      setErrorComprobante(error.message || 'No fue posible enviar el comprobante.');
    } finally {
      setSubiendoComprobante(false);
      event.target.value = '';
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

      {suscripcion && (
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
                <strong>Suscripción activa{suscripcion.subscription_amount ? ` · $${suscripcion.subscription_amount} MXN/mes` : ''}</strong>
                {suscripcion.subscription_next_payment && (
                  <span>Próximo cobro: {new Date(suscripcion.subscription_next_payment).toLocaleDateString('es-MX')}</span>
                )}
              </div>
            </div>
          )}

          {suscripcion.subscription_status === 'pendiente_revision' && (
            <div className="status-banner">
              <div className="banner-text">
                <strong>Tu comprobante ya se envió.</strong>
                <span>Lo estamos revisando; tu suscripción se activa en cuanto se confirme el pago.</span>
              </div>
            </div>
          )}

          {suscripcion.subscription_status === 'sin_suscripcion' && (
            suscripcion.platformPaymentLink ? (
              <>
                <div className="status-banner">
                  <div className="banner-text">
                    <strong>Paga tu suscripción mensual con el link de Mercado Pago de la plataforma.</strong>
                    <a
                      href={suscripcion.platformPaymentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-submit"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", marginTop: 10 }}
                    >
                      Pagar con Mercado Pago
                    </a>
                  </div>
                </div>
                <div className="control-form" style={{ marginTop: 12 }}>
                  <div className="input-group">
                    <label>Ya que hayas pagado, sube tu comprobante</label>
                    <input
                      ref={comprobanteInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={subirComprobanteSuscripcion}
                      disabled={subiendoComprobante}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-submit"
                        onClick={() => comprobanteInputRef.current?.click()}
                        disabled={subiendoComprobante}
                      >
                        {subiendoComprobante ? 'Subiendo...' : 'Elegir archivo'}
                      </button>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>
                        {nombreArchivoComprobante || 'Ninguna imagen seleccionada'}
                      </span>
                    </div>
                  </div>
                  {subiendoComprobante && <p>Enviando comprobante...</p>}
                  {errorComprobante && (
                    <div className="status-banner banner-error zoom-in">
                      <AlertCircle size={20} className="banner-icon" />
                      <div className="banner-text"><strong>{errorComprobante}</strong></div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="status-banner banner-error">
                <AlertCircle size={20} className="banner-icon" />
                <div className="banner-text">
                  <strong>Todavía no hay un link de pago configurado.</strong>
                  <span>Contacta a soporte para activar tu suscripción.</span>
                </div>
              </div>
            )
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
            Link de pago (Mercado Pago) para el anticipo
          </h3>
          <p>
            Crea un link de pago fijo por $100 MXN desde tu cuenta de Mercado Pago y pégalo aquí. Tus clientes lo usarán para pagar el anticipo; tú confirmas cada pago manualmente cuando suban su comprobante.
          </p>
        </div>

        <form onSubmit={guardarLinkPago} className="control-form">
          <div className="form-row">
            <div className="input-group">
              <label>URL de pago (Mercado Pago)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://www.mercadopago.com.mx/...."
                value={linkPago}
                onChange={(e) => setLinkPago(e.target.value)}
                disabled={guardandoLink}
              />
            </div>

            <button type="submit" disabled={guardandoLink} className="btn-submit">
              {guardandoLink ? (
                <span className="btn-content"><span className="spinner"></span>Guardando...</span>
              ) : (
                <span className="btn-content">Guardar</span>
              )}
            </button>
          </div>

          {mensajeLink && (
            <div className={`status-banner ${mensajeLink.startsWith('No fue posible') ? 'banner-error' : 'banner-success'} zoom-in`}>
              {mensajeLink.startsWith('No fue posible') ? <AlertCircle size={20} className="banner-icon" /> : <CheckCircle size={20} className="banner-icon" />}
              <div className="banner-text"><strong>{mensajeLink}</strong></div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
