import React, { useState } from "react";
import "../../styles/owner/owner-inventario.css";

const menuItems = [
  { label: "Finanzas", icon: "💰" },
  { label: "Gestión de Agenda", icon: "📅" },
  { label: "Inventario (Stock)", icon: "📦" },
  { label: "Ingresos", icon: "📈" },
];

const productosIniciales = [
  {
    id: 1,
    nombre: "Cera Mate Pomade",
    proveedor: "Distribuidora Barber MX",
    unidades: 49,
    costoUnitario: 150,
  },
  {
    id: 2,
    nombre: "Shampoo Purificante Barba",
    proveedor: "Distribuidora Barber MX",
    unidades: 49,
    costoUnitario: 150,
  },
  {
    id: 3,
    nombre: "Gel de Fijación Extrema",
    proveedor: "Barber Supplies Co.",
    unidades: 49,
    costoUnitario: 150,
  },
  {
    id: 4,
    nombre: "Cera Mate Pomade",
    proveedor: "Barber Supplies Co.",
    unidades: 49,
    costoUnitario: 150,
  },
];

export default function OwnerInventario() {
  const [seccionActiva, setSeccionActiva] = useState("Inventario (Stock)");
  const [productos, setProductos] = useState(productosIniciales);

  const cambiarUnidades = (id, delta) => {
    setProductos((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, unidades: Math.max(0, p.unidades + delta) }
          : p
      )
    );
  };

  return (
    <div className="oi-layout">
      {/* Header */}
      <header className="oi-header">
        <img src="/logo.png" alt="Barber Hub" className="oi-logo" />
      </header>

      <div className="oi-body">
        {/* Sidebar */}
        <aside className="oi-sidebar">
          <h2 className="oi-sidebar-titulo">
            Panel <span className="oi-owner-tag">Owner</span>
          </h2>

          <nav className="oi-sidebar-menu">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className={`oi-sidebar-item ${
                  seccionActiva === item.label ? "activo" : ""
                }`}
                onClick={() => setSeccionActiva(item.label)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="oi-perfil">
            <div className="oi-avatar">MG</div>
            <div className="oi-perfil-info">
              <span className="oi-perfil-nombre">Marcos Gonzales</span>
              <span className="oi-perfil-rol">Owner</span>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="oi-main">
          <h1 className="oi-titulo">Suministros</h1>
          <p className="oi-subtitulo">
            Control de inventario, semáforo de alerta, costo total y precio
            sugerido de venta al público.Control de inventario, semáforo de
            alerta, costo total y precio sugerido de venta al público.
          </p>

          <div className="oi-panel">
            <table className="oi-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Proveedor Oficial</th>
                  <th className="oi-col-centro">Unidades Restantes</th>
                  <th className="oi-col-centro">Costo Unitario</th>
                  <th className="oi-col-centro">
                    Costo Total
                    <br />
                    del Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td className="oi-celda-bold">{p.nombre}</td>
                    <td className="oi-celda-muted">{p.proveedor}</td>
                    <td className="oi-col-centro">
                      <div className="oi-stepper">
                        <button
                          className="oi-stepper-btn"
                          onClick={() => cambiarUnidades(p.id, 1)}
                        >
                          +
                        </button>
                        <span className="oi-stepper-valor">{p.unidades}</span>
                        <button
                          className="oi-stepper-btn"
                          onClick={() => cambiarUnidades(p.id, -1)}
                        >
                          -
                        </button>
                      </div>
                    </td>
                    <td className="oi-col-centro">${p.costoUnitario}</td>
                    <td className="oi-col-centro oi-celda-bold">
                      ${p.unidades * p.costoUnitario}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}