import { useEffect, useState } from 'react';
import { Plus, Minus, PackagePlus } from 'lucide-react';
import { supabase } from '../../../../lib/supabase.js';
import { apiFetch } from '../../../../utils/api.js';
import '../../styles/owner/owner-inventario.css';

export default function InventarioView() {
  const [barberiaId, setBarberiaId] = useState(null);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevo, setNuevo] = useState({ nombre: '', proveedor: '', stock: 0, costo: 0 });
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cargarInventario = async (bid) => {
    const { data } = await supabase
      .from('inventory_items')
      .select('id, name, stock_on_hand, unit_cost, suppliers(name)')
      .eq('barberia_id', bid)
      .eq('is_active', true)
      .order('name');
    setProductos(data ?? []);
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
      await cargarInventario(membership.barberia_id);
      setCargando(false);
    }

    cargar();
  }, []);

  const agregarProducto = async () => {
    if (!nuevo.nombre.trim() || !barberiaId) return;
    setError('');
    setProcesando(true);

    try {
      let supplierId = null;
      if (nuevo.proveedor.trim()) {
        const { data: existente } = await supabase
          .from('suppliers')
          .select('id')
          .eq('barberia_id', barberiaId)
          .eq('name', nuevo.proveedor.trim())
          .maybeSingle();

        if (existente) {
          supplierId = existente.id;
        } else {
          const { data: creado, error: supplierError } = await supabase
            .from('suppliers')
            .insert({ barberia_id: barberiaId, name: nuevo.proveedor.trim() })
            .select('id')
            .single();
          if (supplierError) throw supplierError;
          supplierId = creado.id;
        }
      }

      const { error: itemError } = await supabase.from('inventory_items').insert({
        barberia_id: barberiaId,
        supplier_id: supplierId,
        name: nuevo.nombre.trim(),
        stock_on_hand: Number(nuevo.stock) || 0,
        unit_cost: Number(nuevo.costo) || 0,
      });
      if (itemError) throw itemError;

      setNuevo({ nombre: '', proveedor: '', stock: 0, costo: 0 });
      await cargarInventario(barberiaId);
    } catch (err) {
      setError(err.message || 'No fue posible agregar el artículo.');
    } finally {
      setProcesando(false);
    }
  };

  const cambiarStock = async (item, delta) => {
    setProcesando(true);
    setError('');
    try {
      await apiFetch('/inventario/movimientos', {
        method: 'POST',
        body: JSON.stringify({
          inventoryItemId: item.id,
          type: delta > 0 ? 'adjustment_in' : 'adjustment_out',
          quantity: Math.abs(delta),
        }),
      });
      await cargarInventario(barberiaId);
    } catch (err) {
      setError(err.message || 'No fue posible actualizar el stock.');
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <div className="inventario-wrapper"><p>Cargando inventario...</p></div>;
  }

  return (
    <div className="inventario-wrapper fade-in">
      <div className="inventario-header">
        <div className="header-titles">
          <h2>Suministros</h2>
          <p>Control de inventario, semáforo de alerta y cálculo de costo total.</p>
        </div>
      </div>

      <div className="add-form-container">
        <div className="form-group flex-fill">
          <label>Nombre del artículo</label>
          <input className="form-input" placeholder="Ej. Navajas doradas" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
        </div>

        <div className="form-group flex-fill">
          <label>Proveedor</label>
          <input className="form-input" placeholder="Ej. Barber Supplies" value={nuevo.proveedor} onChange={(e) => setNuevo({ ...nuevo, proveedor: e.target.value })} />
        </div>

        <div className="form-group number-group">
          <label>Stock</label>
          <input type="number" className="form-input" placeholder="0" value={nuevo.stock} onChange={(e) => setNuevo({ ...nuevo, stock: e.target.value })} />
        </div>

        <div className="form-group number-group">
          <label>Costo unit.</label>
          <input type="number" className="form-input" placeholder="$0.00" value={nuevo.costo} onChange={(e) => setNuevo({ ...nuevo, costo: e.target.value })} />
        </div>

        <div className="form-group btn-group">
          <button onClick={agregarProducto} className="btn-add" disabled={procesando || !nuevo.nombre.trim()}>
            <PackagePlus size={18} /> Agregar
          </button>
        </div>
      </div>

      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

      <div className="table-container">
        <table className="inventario-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Proveedor</th>
              <th className="text-center">Unidades Restantes</th>
              <th className="text-center">Costo Unitario</th>
              <th className="text-center">Costo Total</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">No hay artículos registrados.</td>
              </tr>
            ) : (
              productos.map((prod) => (
                <tr key={prod.id}>
                  <td className="item-name">{prod.name}</td>
                  <td className="item-provider">{prod.suppliers?.name ?? '-'}</td>
                  <td>
                    <div className="stock-control">
                      <button onClick={() => cambiarStock(prod, -1)} className="stock-btn minus" disabled={procesando}>
                        <Minus size={14} />
                      </button>
                      <span className="stock-value">{prod.stock_on_hand}</span>
                      <button onClick={() => cambiarStock(prod, 1)} className="stock-btn plus" disabled={procesando}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="text-center text-gray">${prod.unit_cost}</td>
                  <td className="text-center item-total">${(prod.unit_cost * prod.stock_on_hand).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
