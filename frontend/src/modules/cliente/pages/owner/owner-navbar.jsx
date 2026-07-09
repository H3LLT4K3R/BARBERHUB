import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí puedes limpiar tokens de sesión si los tienes
    navigate('/login');
  };

  return (
    <header style={{
      backgroundColor: '#000000', // var(--black)
      height: '70px',
      padding: '0 40px',
      display: 'flex',
      justifyContent: 'flex-end', // Empuja los botones hacia la derecha
      alignItems: 'center',
      gap: '30px',
      borderBottom: '1px solid #1a1a1a',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      
      {/* ── BOTÓN EXPLORAR LOCALES ── */}
      <button 
        onClick={() => navigate('/explorar')}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ffffff', // var(--white)
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'color 0.2s ease',
          fontFamily: "inherit"
        }}
        // Efecto hover (Cambia a oro al pasar el ratón)
        onMouseOver={(e) => e.target.style.color = '#E9C46A'} 
        onMouseOut={(e) => e.target.style.color = '#ffffff'}
      >
        Explorar locales
      </button>

      {/* ── BOTÓN CERRAR SESIÓN (Destacado en Oro) ── */}
      <button 
        onClick={handleLogout}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          color: '#E9C46A', // var(--bh-gold)
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'opacity 0.2s ease',
          fontFamily: "inherit"
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
      >
        Cerrar sesión
        <LogOut size={18} color="#E9C46A" />
      </button>

    </header>
  );
}