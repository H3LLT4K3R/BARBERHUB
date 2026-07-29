import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, Receipt, DollarSign } from 'lucide-react';
import { supabase } from '../../../../lib/supabase.js';
import { apiFetch } from '../../../../utils/api.js';
import '../../styles/owner/owner-finanzas.css';

export default function OwnerFinanzas() {
  const [barberiaId, setBarberiaId] = useState(null);
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cargarTransacciones = async (bid) => {
    const { data } = await supabase
      .from('financial_transactions')
      .select('id, type, category, amount, description, occurred_at')
      .eq('barberia_id', bid)
      .order('occurred_at', { ascending: false })
      .limit(50);

    const lista = data ?? [];
    setIngresos(lista.filter((t) => t.type === 'income'));
    setEgresos(lista.filter((t) => t.type === 'expense'));
  };

  useEffect(() => {
    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: membership } = await supabase
        .from('barberia_memberships')
        .select('barberia_id')
        .eq('profile_id', uid)
        .in('role', ['owner', 'admin'])
        .eq('is_active', true)
        .maybeSingle();

      if (!membership) {
        setCargando(false);
        return;
      }

      setBarberiaId(membership.barberia_id);
      await cargarTransacciones(membership.barberia_id);
      setCargando(false);
    }

    cargar();
  }, []);

  const ingresosTotales = ingresos.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalEgresos = egresos.reduce((sum, item) => sum + Number(item.amount), 0);
  const gananciaTotal = ingresosTotales - totalEgresos;

  const handleAddEgreso = async (e) => {
    e.preventDefault();
    if (!concepto || !monto || !barberiaId) return;

    setEnviando(true);
    setError('');
    try {
      await apiFetch('/finanzas/transacciones', {
        method: 'POST',
        body: JSON.stringify({
          barberiaId,
          type: 'expense',
          category: 'gasto_general',
          amount: parseFloat(monto),
          description: concepto,
        }),
      });
      setConcepto('');
      setMonto('');
      await cargarTransacciones(barberiaId);
    } catch (err) {
      setError(err.message || 'No fue posible registrar el egreso.');
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return <div className="finanzas-wrapper"><p>Cargando finanzas...</p></div>;
  }

  return (
    <div className="finanzas-wrapper fade-in">
      <header className="finanzas-header">
        <div className="header-title">
          <Wallet className="icon-gold" size={28} />
          <div>
            <h1>Consolidado de Finanzas</h1>
            <p>Monitoreo de ingresos por captación, egresos y utilidad neta.</p>
          </div>
        </div>
      </header>

      <div className="finanzas-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon bg-green-light"><TrendingUp size={24} className="text-green" /></div>
          <div className="kpi-info">
            <h3>Ingresos Totales</h3>
            <p className="kpi-amount text-green">${ingresosTotales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon bg-red-light"><TrendingDown size={24} className="text-red" /></div>
          <div className="kpi-info">
            <h3>Egresos Totales</h3>
            <p className="kpi-amount text-red">${totalEgresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="kpi-card card-dark">
          <div className="kpi-icon bg-gold-transparent"><DollarSign size={24} className="text-gold" /></div>
          <div className="kpi-info">
            <h3>Ganancia Neta</h3>
            <p className="kpi-amount text-gold">${gananciaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="finanzas-content-grid">
        <div className="finanzas-panel">
          <div className="panel-header">
            <h2>Últimos Cobros</h2>
          </div>

          <div className="registro-list">
            {ingresos.length === 0 && <div className="empty-state">No hay ingresos registrados.</div>}
            {ingresos.map((item) => (
              <div className="registro-item" key={item.id}>
                <div className="registro-icono bg-gray-light">
                  <Receipt size={20} className="text-gray" />
                </div>
                <div className="registro-detalles">
                  <p className="registro-titulo">{item.description ?? item.category}</p>
                  <p className="registro-sub">{new Date(item.occurred_at).toLocaleString('es-MX')}</p>
                </div>
                <div className="registro-valor">
                  <p className="valor-positivo">+${Number(item.amount).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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
              <button type="submit" className="btn-agregar" disabled={!concepto || !monto || enviando}>
                <Plus size={20} />
                Agregar
              </button>
            </div>
            {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
          </form>

          <div className="registro-list mt-6">
            <h3 className="list-subtitle">Historial de Gastos</h3>

            {egresos.length === 0 ? (
              <div className="empty-state">No hay egresos registrados.</div>
            ) : (
              egresos.map((item) => (
                <div key={item.id} className="registro-item">
                  <div className="registro-detalles">
                    <p className="registro-titulo">{item.description}</p>
                    <p className="registro-sub">{new Date(item.occurred_at).toLocaleString('es-MX')}</p>
                  </div>
                  <div className="registro-acciones">
                    <p className="valor-negativo">-${Number(item.amount).toFixed(2)}</p>
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
