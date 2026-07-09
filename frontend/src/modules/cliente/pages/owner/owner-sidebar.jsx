import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function OwnerSidebar() {
  const location = useLocation();

  // Se agregó la ruta del perfil a la lista de navegación
  const navItems = [
    { path: '/perfilBarberia', label: 'Perfil Barbería' },
    { path: '/owner-finanzas', label: 'Finanzas' },
    { path: '/owner-agenda', label: 'Gestión de Agenda' },
    { path: '/owner-inventario', label: 'Inventario (Stock)' },
    { path: '/owner-estadisticas', label: 'Estadísticas' },
    { path: '/owner-seguridad', label: 'Seguridad' },
    { path: '/owner-control', label: 'Control de Negocio' }
    
  ];

  return (
    <aside style={{ width: '256px', height: '100vh', backgroundColor: 'white', borderRight: '1px solid #e5e7eb' }}>
      
      <div style={{ padding: '32px 16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
          Panel <span style={{ color: '#D4AF37' }}>Owner</span>
        </h1>
      </div>
      
      <nav style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '12px 20px',
                borderRadius: '9999px',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: '600',
                backgroundColor: isActive ? 'black' : 'transparent',
                color: isActive ? '#D4AF37' : '#6b7280',
                transition: 'all 0.3s'
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}