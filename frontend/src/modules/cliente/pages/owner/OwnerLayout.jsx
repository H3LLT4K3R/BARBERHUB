import React from 'react';
import OwnerSidebar from './owner-sidebar';
import Navbar from './owner-navbar'; // Asegúrate de que esta ruta apunte a donde realmente pusiste tu navbar

// El prop { children } es VITAL. Es lo que permite que PerfilBarberia se inyecte aquí adentro.
export default function OwnerLayout({ children }) {
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb', overflow: 'hidden' }}>
      
      {/* 1. Barra lateral a la izquierda (Blanca con detalles dorados) */}
      <OwnerSidebar />

      {/* 2. Contenedor del lado derecho (Navbar + Contenido) */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        
        {/* Barra superior negra */}
        <Navbar />

        {/* 3. Área principal donde se renderiza PerfilBarberia, Finanzas, etc. */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>

      </div>
      
    </div>
  );
}