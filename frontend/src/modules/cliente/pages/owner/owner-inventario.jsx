import React, { useState } from 'react';
import { Plus, Minus, PackagePlus, Store, Wrench } from 'lucide-react';
import '../../styles/owner/owner-inventario.css'; // Ajusta la ruta según tu proyecto

export default function InventarioView() {
  const [productos, setProductos] = useState([
    { id: 1, nombre: 'Cera Mate Pomade', pro: 'Distribuidora Barber MX', stock: 49, costo: 150, tipo: 'producto' },
    { id: 2, nombre: 'Shampoo Purificante', pro: 'Distribuidora Barber MX', stock: 12, costo: 180, tipo: 'producto' },
    { id: 3, nombre: 'Gel de Fijación Extrema', pro: 'Barber Supplies Co.', stock: 25, costo: 110, tipo: 'producto' },
    { id: 4, nombre: 'Toallas Desechables', pro: 'Distribuidora Barber MX', stock: 100, costo: 15, tipo: 'insumo' },
  ]);

  const [tabActiva, setTabActiva] = useState('producto');
  const [nuevo, setNuevo] = useState({ nombre: '', pro: '', stock: 0, costo: 0, tipo: 'producto' });

  const agregarProducto = () => {
    if (!nuevo.nombre || !nuevo.pro) return;
    
    const productoConId = {
      ...nuevo,
      id: Date.now(),
      stock: Number(nuevo.stock),
      costo: Number(nuevo.costo)
    };

    setProductos([...productos, productoConId]);
    setNuevo({ nombre: '', pro: '', stock: 0, costo: 0, tipo: nuevo.tipo });
  };

  const cambiarStock = (id, cantidad) => {
    setProductos(productos.map(p => {
      if (p.id === id) {
        const nuevoStock = p.stock + cantidad;
        return { ...p, stock: nuevoStock < 0 ? 0 : nuevoStock };
      }
      return p;
    }));
  };

  const productosFiltrados = productos.filter(p => p.tipo === tabActiva);

  return (
    <div className="inventario-wrapper fade-in">
      
      {/* HEADER Y TABS */}
      <div className="inventario-header">
        <div className="header-titles">
          <h2>Suministros</h2>
          <p>Control de inventario, semáforo de alerta y cálculo de costo total.</p>
        </div>
        
        <div className="tabs-container">
          <button 
            onClick={() => setTabActiva('producto')}
            className={`tab-btn ${tabActiva === 'producto' ? 'tab-active' : ''}`}
          >
            <Store size={16} /> Productos (Venta)
          </button>
          <button 
            onClick={() => setTabActiva('insumo')}
            className={`tab-btn ${tabActiva === 'insumo' ? 'tab-active' : ''}`}
          >
            <Wrench size={16} /> Insumos (Uso Interno)
          </button>
        </div>
      </div>

      {/* FORMULARIO AGREGAR */}
      <div className="add-form-container">
        <div className="form-group type-group">
          <label>Clasificación</label>
          <select 
            className="form-input" 
            value={nuevo.tipo} 
            onChange={e => setNuevo({...nuevo, tipo: e.target.value})}
          >
            <option value="producto">Producto (Venta)</option>
            <option value="insumo">Insumo (Interno)</option>
          </select>
        </div>
        
        <div className="form-group flex-fill">
          <label>Nombre del artículo</label>
          <input 
            className="form-input" 
            placeholder="Ej. Navajas doradas" 
            value={nuevo.nombre} 
            onChange={e => setNuevo({...nuevo, nombre: e.target.value})} 
          />
        </div>

        <div className="form-group flex-fill">
          <label>Proveedor</label>
          <input 
            className="form-input" 
            placeholder="Ej. Barber Supplies" 
            value={nuevo.pro} 
            onChange={e => setNuevo({...nuevo, pro: e.target.value})} 
          />
        </div>

        <div className="form-group number-group">
          <label>Stock</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="0" 
            value={nuevo.stock} 
            onChange={e => setNuevo({...nuevo, stock: e.target.value})} 
          />
        </div>

        <div className="form-group number-group">
          <label>Costo unit.</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="$0.00" 
            value={nuevo.costo} 
            onChange={e => setNuevo({...nuevo, costo: e.target.value})} 
          />
        </div>

        <div className="form-group btn-group">
          <button onClick={agregarProducto} className="btn-add">
            <PackagePlus size={18}/> Agregar
          </button>
        </div>
      </div>

      {/* TABLA DE INVENTARIO */}
      <div className="table-container">
        <table className="inventario-table">
          <thead>
            <tr>
              <th>Descripción ({tabActiva === 'producto' ? 'Producto' : 'Insumo'})</th>
              <th>Proveedor Oficial</th>
              <th className="text-center">Unidades Restantes</th>
              <th className="text-center">Costo Unitario</th>
              <th className="text-center">Costo Total</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  No hay {tabActiva === 'producto' ? 'productos' : 'insumos'} registrados en esta categoría.
                </td>
              </tr>
            ) : (
              productosFiltrados.map((prod) => (
                <tr key={prod.id}>
                  <td className="item-name">{prod.nombre}</td>
                  <td className="item-provider">{prod.pro}</td>
                  <td>
                    <div className="stock-control">
                      <button onClick={() => cambiarStock(prod.id, -1)} className="stock-btn minus">
                        <Minus size={14}/>
                      </button>
                      <span className="stock-value">{prod.stock}</span>
                      <button onClick={() => cambiarStock(prod.id, 1)} className="stock-btn plus">
                        <Plus size={14}/>
                      </button>
                    </div>
                  </td>
                  <td className="text-center text-gray">${prod.costo}</td>
                  <td className="text-center item-total">${(prod.costo * prod.stock).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}