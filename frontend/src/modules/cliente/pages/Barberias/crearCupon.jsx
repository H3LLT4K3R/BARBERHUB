import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase.js';
import '../../styles/Barberias/crearCupon.css';

const DIAS_SEMANA = [
  { valor: 1, etiqueta: 'Lun' },
  { valor: 2, etiqueta: 'Mar' },
  { valor: 3, etiqueta: 'Mié' },
  { valor: 4, etiqueta: 'Jue' },
  { valor: 5, etiqueta: 'Vie' },
  { valor: 6, etiqueta: 'Sáb' },
  { valor: 0, etiqueta: 'Dom' },
];

export default function CrearCupon() {
  const navigate = useNavigate();
  const [barberiaId, setBarberiaId] = useState(null);
  const [nombreBarberia, setNombreBarberia] = useState('');
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState('%');
  const [valor, setValor] = useState('');
  const [fecha, setFecha] = useState('');
  const [usoMaximo, setUsoMaximo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Reglas de segmentación (todas opcionales)
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [barberoId, setBarberoId] = useState('');
  const [minimoVisitas, setMinimoVisitas] = useState('');
  const [maximoVisitas, setMaximoVisitas] = useState('');
  const [gastoMinimo, setGastoMinimo] = useState('');
  const [diasValidos, setDiasValidos] = useState([]);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [mostrarSegmentacion, setMostrarSegmentacion] = useState(false);

  useEffect(() => {
    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: membership } = await supabase
        .from('barberia_memberships')
        .select('barberia_id, barberias(name)')
        .eq('profile_id', uid)
        .in('role', ['owner', 'admin'])
        .eq('is_active', true)
        .maybeSingle();

      if (membership) {
        setBarberiaId(membership.barberia_id);
        setNombreBarberia(membership.barberias?.name ?? '');

        const [{ data: serviciosData }, { data: barberosData }] = await Promise.all([
          supabase.from('services').select('id, name').eq('barberia_id', membership.barberia_id).eq('is_active', true).order('name'),
          supabase.from('barberia_memberships').select('id, display_name').eq('barberia_id', membership.barberia_id).eq('role', 'barber').eq('is_active', true),
        ]);
        setServicios(serviciosData ?? []);
        setBarberos(barberosData ?? []);
      }
    }
    cargar();
  }, []);

  const alternarDia = (dia) => {
    setDiasValidos((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]));
  };

  const generarCodigo = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = 'BARBER';
    for (let i = 0; i < 4; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setCodigo(resultado);
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '--/--/----';
    const [year, month, day] = fechaStr.split('-');
    return `${parseInt(day)}/${parseInt(month)}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!barberiaId) return;
    if (!nombre.trim() || !codigo.trim() || !valor || !fecha) {
      setError('Completa nombre, código, valor y fecha de expiración.');
      return;
    }

    setEnviando(true);
    setError('');

    try {
      const { error: insertError } = await supabase.from('coupons').insert({
        barberia_id: barberiaId,
        code: codigo.trim().toUpperCase(),
        description: nombre.trim(),
        discount_type: tipo === '%' ? 'percent' : 'fixed',
        discount_value: Number(valor),
        starts_at: new Date().toISOString(),
        ends_at: `${fecha}T23:59:59`,
        usage_limit: usoMaximo ? Number(usoMaximo) : null,
        service_id: servicioId || null,
        barber_membership_id: barberoId || null,
        minimum_visits: minimoVisitas ? Number(minimoVisitas) : null,
        maximum_visits: maximoVisitas ? Number(maximoVisitas) : null,
        minimum_spent: gastoMinimo ? Number(gastoMinimo) : null,
        valid_weekdays: diasValidos.length ? diasValidos : null,
        valid_time_start: horaInicio || null,
        valid_time_end: horaFin || null,
      });
      if (insertError) throw insertError;

      navigate('/owner-fidelidad');
    } catch (err) {
      setError(
        err.message?.includes('duplicate key')
          ? 'Ya existe un cupón con ese código en tu barbería.'
          : err.message || 'No fue posible crear el cupón.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="cc-wrapper">
      <div className="grid-card">
        <form onSubmit={handleSubmit} className="form-side">
          <div>
            <h2 className="title-main">✂️ Crear Nuevo Cupón</h2>
            <p className="subtitle">Configura una nueva oferta para tus clientes.</p>
          </div>

          <hr className="separator" />

          <div className="form-section">
            <h3 className="section-title">1. Información Básica</h3>
            <div className="inputs-grid">
              <div className="input-group">
                <label className="label-style">Nombre del Cupón</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="input-field"
                  placeholder="Ej. Promo de sábado"
                />
              </div>
              <div className="input-group">
                <label className="label-style">Código del Cupón</label>
                <div className="flex-row-gap">
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="input-field-code"
                    placeholder="Ej. BARBER10"
                  />
                  <button type="button" onClick={generarCodigo} className="btn-rayo">⚡</button>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">2. Valor del Descuento</h3>
            <div className="inputs-grid">
              <div className="input-group">
                <label className="label-style">Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="input-field">
                  <option value="%">Porcentaje (%)</option>
                  <option value="$">Monto Fijo ($)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="label-style">Valor</label>
                <input
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">3. Vigencia y Límites</h3>
            <div className="inputs-grid">
              <div className="input-group">
                <label className="label-style">Fecha de Expiración</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <label className="label-style">Uso Máximo Total (opcional)</label>
                <input
                  type="number"
                  value={usoMaximo}
                  onChange={(e) => setUsoMaximo(e.target.value)}
                  className="input-field"
                  placeholder="Sin límite"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <button
              type="button"
              className="btn-toggle-segmentacion"
              onClick={() => setMostrarSegmentacion((v) => !v)}
            >
              {mostrarSegmentacion ? '− Ocultar' : '+ Agregar'} reglas de segmentación (opcional)
            </button>

            {mostrarSegmentacion && (
              <div className="segmentacion-panel">
                <div className="inputs-grid">
                  <div className="input-group">
                    <label className="label-style">Solo para este servicio</label>
                    <select value={servicioId} onChange={(e) => setServicioId(e.target.value)} className="input-field">
                      <option value="">Cualquier servicio</option>
                      {servicios.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="label-style">Solo con este barbero</label>
                    <select value={barberoId} onChange={(e) => setBarberoId(e.target.value)} className="input-field">
                      <option value="">Cualquier barbero</option>
                      {barberos.map((b) => (
                        <option key={b.id} value={b.id}>{b.display_name || 'Barbero'}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="label-style">Mínimo de visitas (cliente frecuente)</label>
                    <input
                      type="number"
                      min="0"
                      value={minimoVisitas}
                      onChange={(e) => setMinimoVisitas(e.target.value)}
                      className="input-field"
                      placeholder="Ej. 5"
                    />
                  </div>
                  <div className="input-group">
                    <label className="label-style">Máximo de visitas (solo clientes nuevos)</label>
                    <input
                      type="number"
                      min="0"
                      value={maximoVisitas}
                      onChange={(e) => setMaximoVisitas(e.target.value)}
                      className="input-field"
                      placeholder="Ej. 0"
                    />
                  </div>
                  <div className="input-group">
                    <label className="label-style">Gasto mínimo acumulado ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={gastoMinimo}
                      onChange={(e) => setGastoMinimo(e.target.value)}
                      className="input-field"
                      placeholder="Sin mínimo"
                    />
                  </div>
                  <div className="input-group">
                    <label className="label-style">Horario válido</label>
                    <div className="flex-row-gap">
                      <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="input-field" />
                      <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="input-field" />
                    </div>
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: 16 }}>
                  <label className="label-style">Días válidos</label>
                  <div className="days-container">
                    {DIAS_SEMANA.map((d) => (
                      <label key={d.valor} className="day-checkbox-label">
                        <input
                          type="checkbox"
                          checked={diasValidos.includes(d.valor)}
                          onChange={() => alternarDia(d.valor)}
                        />
                        {d.etiqueta}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

          <div className="footer-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/owner-fidelidad')}>Cancelar</button>
            <button type="submit" className="btn-submit" disabled={enviando}>
              {enviando ? 'Guardando...' : 'Activar Cupón'}
            </button>
          </div>
        </form>

        <div className="preview-side">
          <h3 className="preview-title">Vista Previa del Cliente</h3>
          <div className="cupon-card">
            <div className="card-brand">💈 {nombreBarberia || 'TU BARBERÍA'} 💈</div>
            <div className="card-discount-container">
              <span className="card-discount-label">Descuento de</span>
              <div className="card-discount-value">
                {tipo === '%' ? `${valor || 0}% OFF` : `$${valor || 0} MXN`}
              </div>
            </div>
            <div className="card-coupon-name">{nombre || 'Nombre del Cupón'}</div>
            <div className="card-code-box">
              <span className="card-code-label">Código</span>
              <span className="card-code-text">{codigo || 'CÓDIGO'}</span>
            </div>
            <div className="card-footer-info">
              <div>📅 Expira: {formatFecha(fecha)}</div>
            </div>
          </div>
          <p className="preview-hint">
            Así es exactamente como se visualizará en la aplicación móvil de tus clientes.
          </p>
        </div>
      </div>
    </main>
  );
}
