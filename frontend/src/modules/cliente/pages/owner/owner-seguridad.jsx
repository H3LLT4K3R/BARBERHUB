import React, { useState } from 'react';
import '../../styles/owner/owner-seguridad.css'; // <-- Ajusta esta ruta a tu proyecto

export default function SeguridadView() {
  const [permisos, setPermisos] = useState([
    { id: 1, title: 'Balance Financiero (Módulo Finanzas)', desc: 'Acceso a ver ingresos totales, ganancia neta y KPIs.', active: true },
    { id: 2, title: 'Módulo de Egresos y Caja Chica', desc: 'Permite registrar nuevos gastos operativos y ver el listado.', active: true },
    { id: 3, title: 'Gestión de Inventario (Suministros)', desc: 'Habilita al administrador para controlar los niveles de stock.', active: false },
    { id: 4, title: 'Agenda & Citas (Soporte Operativo)', desc: 'Obligatorio para administrar el negocio. Aceptar o rechazar citas.', active: true }
  ]);

  const togglePermiso = (id) => {
    setPermisos(permisos.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <div className="seguridad-wrapper fade-in">
      
      {/* Encabezado */}
      <div className="seguridad-header">
        <h2>Seguridad de la Plataforma</h2>
        <p>Habilita o restringe los accesos que tendrá tu Administrador en el Dashboard Espejo.</p>
      </div>

      {/* Contenedor Principal */}
      <div className="security-panel">
        
        {/* Banner de Perfil */}
        <div className="profile-banner">
          <div className="profile-avatar">
            AD
          </div>
          <div className="profile-info">
            <h3>Perfil: Administrador Operativo</h3>
            <p>Mapeo de accesos de la sucursal</p>
          </div>
        </div>

        {/* Lista de Permisos */}
        <div className="permissions-list">
          {permisos.map((item) => (
            <div 
              key={item.id} 
              className={`permission-card ${item.active ? 'is-active' : 'is-inactive'}`}
            >
              <div className="permission-text">
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
              
              {/* Botón Toggle Moderno */}
              <button 
                onClick={() => togglePermiso(item.id)}
                className={`toggle-switch ${item.active ? 'toggle-on' : 'toggle-off'}`}
                aria-pressed={item.active}
              >
                <div className="toggle-circle"></div>
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}