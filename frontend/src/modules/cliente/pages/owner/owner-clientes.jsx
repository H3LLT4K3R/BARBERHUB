import React, { useState } from 'react';
import { Search, UserCircle, Phone, AlertTriangle, Scissors } from 'lucide-react';
import '../../styles/owner/owner-usuarios.css';

export default function OwnerClientes() {
  const [busqueda, setBusqueda] = useState('');
  
  // Base de datos simulada según los KPI de tu apunte
  const [clientes] = useState([
    { id: 1, nombre: 'David García', cel: '555-0123', visitas: 12, corteFavorito: 'Taper Fade', preferencias: 'Poco gel, navaja suave', alergias: 'Ninguna' },
    { id: 2, nombre: 'Alejandro Torres', cel: '555-0456', visitas: 4, corteFavorito: 'Corte Clásico + Barba', preferencias: 'Toalla caliente', alergias: 'Alergia al aftershave con alcohol' },
  ]);

  const clientesFiltrados = clientes.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="owner-usuarios-container fade-in">
      <h1 className="owner-usuarios-title">Historial de Clientes</h1>
      <p className="owner-usuarios-description">Gestiona preferencias, número de visitas y alergias de los clientes frecuentes.</p>

      {/* Buscador */}
      <div className="owner-usuarios-card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f9fafb', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <Search size={20} color="#9ca3af" />
          <input 
            type="text" 
            placeholder="Buscar cliente por nombre..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '16px' }}
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="accounts-list-stack">
        {clientesFiltrados.map((cliente) => (
          <div key={cliente.id} className="account-row-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '20px', gap: '15px' }}>
            
            {/* Cabecera del Cliente */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <UserCircle size={40} color="#D4AF37" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{cliente.nombre}</h3>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                    <Phone size={14} /> {cliente.cel}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ backgroundColor: '#111827', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  {cliente.visitas} Visitas
                </span>
              </div>
            </div>

            {/* Detalles Operativos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', gap: '20px' }}>
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}><Scissors size={12} className="inline-icon"/> Corte / Preferencias</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{cliente.corteFavorito}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#4b5563' }}>Nota: {cliente.preferencias}</p>
              </div>
              
              <div style={{ backgroundColor: cliente.alergias !== 'Ninguna' ? '#fef2f2' : '#f9fafb', padding: '10px', borderRadius: '8px', border: cliente.alergias !== 'Ninguna' ? '1px solid #fca5a5' : '1px solid #e5e7eb' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: cliente.alergias !== 'Ninguna' ? '#dc2626' : '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <AlertTriangle size={14} /> Alergias / Precauciones
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: cliente.alergias !== 'Ninguna' ? '#991b1b' : '#374151', fontWeight: cliente.alergias !== 'Ninguna' ? 'bold' : 'normal' }}>
                  {cliente.alergias}
                </p>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}