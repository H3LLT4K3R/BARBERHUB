import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, Receipt, DollarSign } from 'lucide-react';
import '../../styles/owner/owner-finanzas.css';

export default function OwnerFinanzas() {
  const [ingresosTotales] = useState(19850);
  const [egresos, setEgresos] = useState([
    { id: 1, concepto: 'Compra Insumos (Cera / Navajas)', responsable: 'Carlos (Admin)', monto: 1200 }
  ]);
  
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');

  const totalEgresos = egresos.reduce((sum, item) => sum + item.monto, 0);
  const gananciaTotal = ingresosTotales - totalEgresos;

  const handleAddEgreso = (e) => {
    e.preventDefault();
    if (!concepto || !monto) return;

    const newEgreso = {
      id: Date.now(),
      concepto: concepto,
      responsable: 'Propietario (Tú)',
      monto: parseFloat(monto)
    };

    setEgresos([...egresos, newEgreso]);
    setConcepto('');
    setMonto('');
  };

  const handleEliminarEgreso = (id) => {
    setEgresos(egresos.filter(item => item.id !== id));
  };

  return (
    <div className="finanzas-wrapper fade-in">
      
      {/* Encabezado */}
      <header className="finanzas-header">
        <div className="header-title">
          <Wallet className="icon-gold" size={28} />
          <div>
            <h1>Consolidado de Finanzas</h1>
            <p>Monitoreo de ingresos por captación, egresos y utilidad neta.</p>
          </div>
        </div>
      </header>

      {/* Tarjetas KPI (Key Performance Indicators) */}
      <div className="finanzas-kpi-grid">
        
        <div className="kpi-card">
          <div className="kpi-icon bg-green-light">
            <TrendingUp size={24} className="text-green" />
          </div>
          <div className="kpi-info">
            <h3>Ingresos Totales</h3>
            <p className="kpi-amount text-green">
              ${ingresosTotales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-red-light">
            <TrendingDown size={24} className="text-red" />
          </div>
          <div className="kpi-info">
            <h3>Egresos Totales</h3>
            <p className="kpi-amount text-red">
              ${totalEgresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="kpi-card card-dark">
          <div className="kpi-icon bg-gold-transparent">
            <DollarSign size={24} className="text-gold" />
          </div>
          <div className="kpi-info">
            <h3>Ganancia Neta</h3>
            <p className="kpi-amount text-gold">
              ${gananciaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

      </div>

      {/* Contenedores de Detalle */}
      <div className="finanzas-content-grid">
        
        {/* Panel Izquierdo: Ingresos */}
        <div className="finanzas-panel">
          <div className="panel-header">
            <h2>Últimos Cobros</h2>
            <span className="badge">Hoy</span>
          </div>
          
          <div className="registro-list">
            {/* Ejemplo estático del cobro */}
            <div className="registro-item">
              <div className="registro-icono bg-gray-light">
                <Receipt size={20} className="text-gray" />
              </div>
              <div className="registro-detalles">
                <p className="registro-titulo">Taper Fade</p>
                <p className="registro-sub">Cliente: David G. • Atendió: Juan</p>
              </div>
              <div className="registro-valor">
                <p className="valor-positivo">+$300.00</p>
                <p className="registro-metodo">Efectivo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Control de Egresos */}
        <div className="finanzas-panel border-top-gold">
          <div className="panel-header">
            <h2>Registrar Egreso</h2>
          </div>
          
          <form onSubmit={handleAddEgreso} className="form-egreso">
            <div className="input-group">
              <label>Concepto del gasto</label>
              <input 
                type="text" 
                placeholder="Ej. Compra de navajas..." 
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="input-moderno"
              />
            </div>
            <div className="form-row">
              <div className="input-group flex-1">
                <label>Monto</label>
                <div className="input-with-icon">
                  <span className="input-icon">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="input-moderno pl-8"
                  />
                </div>
              </div>
              <button type="submit" className="btn-agregar" disabled={!concepto || !monto}>
                <Plus size={20} />
                Agregar
              </button>
            </div>
          </form>
          
          <div className="registro-list mt-6">
            <h3 className="list-subtitle">Historial de Gastos</h3>
            
            {egresos.length === 0 ? (
              <div className="empty-state">No hay egresos registrados.</div>
            ) : (
              egresos.map((item) => (
                <div key={item.id} className="registro-item">
                  <div className="registro-detalles">
                    <p className="registro-titulo">{item.concepto}</p>
                    <p className="registro-sub">Registró: {item.responsable}</p>
                  </div>
                  <div className="registro-acciones">
                    <p className="valor-negativo">-${item.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                    <button 
                      type="button" 
                      onClick={() => handleEliminarEgreso(item.id)} 
                      className="btn-icon-eliminar"
                      title="Eliminar registro"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}