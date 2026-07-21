import React from 'react';
import { Gift, Award, Percent } from 'lucide-react';
import '../../styles/owner/owner-finanzas.css';

export default function OwnerFidelidad() {
  return (
    <div className="finanzas-wrapper fade-in">
      <header className="finanzas-header">
        <div className="header-title">
          <Gift className="icon-gold" size={28} />
          <div>
            <h1>Fidelidad y Promociones</h1>
            <p>Control de tarjetas de lealtad y campañas de descuento.</p>
          </div>
        </div>
      </header>

      {/* KPIs de Lealtad según el apunte */}
      <div className="finanzas-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-gold-transparent">
            <Award size={24} className="text-gold" />
          </div>
          <div className="kpi-info">
            <h3>Tarjetas Activas</h3>
            <p className="kpi-amount text-gold">145</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-green-light">
            <Gift size={24} className="text-green" />
          </div>
          <div className="kpi-info">
            <h3>Cortes Gratis Canjeados</h3>
            <p className="kpi-amount text-green">28 <span style={{fontSize: '12px', color: '#6b7280', fontWeight: 'normal'}}>este mes</span></p>
          </div>
        </div>
      </div>

      <div className="finanzas-content-grid" style={{ marginTop: '2rem' }}>
        
        {/* Panel 1: Reglas de Tarjeta de Lealtad */}
        <div className="finanzas-panel">
          <div className="panel-header">
            <h2>Configuración Tarjeta Lealtad</h2>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
             <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                {[1,2,3,4,5].map(sello => (
                  <div key={sello} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px dashed #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontWeight: 'bold' }}>
                    {sello === 5 ? <Gift size={20}/> : sello}
                  </div>
                ))}
             </div>
             <p style={{ fontWeight: 'bold', fontSize: '16px' }}>Regla actual: 4 Cortes = 1 Gratis</p>
             <button className="btn-agregar" style={{ marginTop: '15px', width: '100%', justifyContent: 'center' }}>Modificar Regla</button>
          </div>
        </div>

        {/* Panel 2: Promociones Activas */}
        <div className="finanzas-panel border-top-gold">
          <div className="panel-header">
            <h2>Promociones Activas</h2>
          </div>
          <div className="registro-list">
            <div className="registro-item">
              <div className="registro-icono bg-gray-light">
                <Percent size={20} className="text-gray" />
              </div>
              <div className="registro-detalles">
                <p className="registro-titulo">Descuento Estudiantes</p>
                <p className="registro-sub">Código: ESTUDIO20 • Uso: 42 veces</p>
              </div>
              <div className="registro-valor">
                <p className="valor-negativo">-20%</p>
                <p className="registro-metodo">Corte Clásico</p>
              </div>
            </div>
            
            <button className="btn-agregar" style={{ marginTop: '15px', width: '100%', justifyContent: 'center', backgroundColor: '#111827', color: 'white' }}>
              + Crear Nueva Promoción
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}