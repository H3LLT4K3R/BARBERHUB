import React, { useState } from 'react';
import '../../styles/Barberias/crearCupon.css';

export default function CrearCupon() {
  const [nombre, setNombre] = useState('Promo sabado');
  const [codigo, setCodigo] = useState('75482');
  const [tipo, setTipo] = useState('%');
  const [valor, setValor] = useState('150');
  const [fecha, setFecha] = useState('2026-06-27');
  const [usoMaximo, setUsoMaximo] = useState('1');
  const [dias, setDias] = useState({ lun: false, mar: false, mie: false, jue: false, vie: false, sab: true });

  const handleCheckboxChange = (dia) => {
    setDias(prev => ({ ...prev, [dia]: !prev[dia] }));
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
    if (!fechaStr) return '27/6/2026';
    const [year, month, day] = fechaStr.split('-');
    return `${parseInt(day)}/${parseInt(month)}/${year}`;
  };

  return (
    <main className="content-wrapper">
      <div className="grid-card">
        {/* Formulario */}
        <form onSubmit={(e) => e.preventDefault()} className="form-side">
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
                <label className="label-style">Uso Máximo Total</label>
                <input 
                  type="number" 
                  value={usoMaximo} 
                  onChange={(e) => setUsoMaximo(e.target.value)} 
                  className="input-field" 
                />
              </div>
            </div>

            <div>
              <label className="label-style" style={{ marginBottom: '8px' }}>Días válidos</label>
              <div className="days-container">
                {Object.keys(dias).map((dia) => (
                  <label key={dia} className="day-checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={dias[dia]} 
                      onChange={() => handleCheckboxChange(dia)} 
                    />
                    {dia === 'mie' ? 'Mié' : dia === 'sab' ? 'Sáb' : dia.charAt(0).toUpperCase() + dia.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-actions">
            <button type="button" className="btn-cancel">Cancelar</button>
            <button type="submit" className="btn-submit" onClick={() => alert('¡Cupón Guardado!')}>
              Activar Cupón
            </button>
          </div>
        </form>

        {/* Vista Previa */}
        <div className="preview-side">
          <h3 className="preview-title">Vista Previa del Cliente</h3>
          <div className="cupon-card">
            <div className="card-brand">💈 BARBERÍA CLASSIC 💈</div>
            <div className="card-discount-container">
              <span className="card-discount-label">Descuento de</span>
              <div className="card-discount-value">
                {tipo === '%' ? `${valor || 0}% OFF` : `$${valor || 0} USD`}
              </div>
            </div>
            <div className="card-coupon-name">{nombre || 'Nombre del Cupón'}</div>
            <div className="card-code-box">
              <span className="card-code-label">Código</span>
              <span className="card-code-text">{codigo || 'CÓDIGO'}</span>
            </div>
            <div className="card-footer-info">
              <div>📅 Expira: {formatFecha(fecha)}</div>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>*Válido para días seleccionados.</div>
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
