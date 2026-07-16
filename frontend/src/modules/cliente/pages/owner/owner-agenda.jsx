import { useState } from "react";
import "../../styles/owner/owner-agenda.css";

export default function OwnerAgenda() {
  const [citasPendientes, setCitasPendientes] = useState([
    {
      id: 1,
      cliente: "Emanuel R.",
      total: 450,
      anticipo: 150,
      servicio: "Corte Clásico + Barba",
      barbero: "Carlos (Master)",
    },
    {
      id: 2,
      cliente: "Alejandro M.",
      total: 300,
      anticipo: 100,
      servicio: "Taper Fade",
      barbero: "Juan (Jr)",
    },
    {
      id: 3,
      cliente: "Christian T.",
      total: 600,
      anticipo: 200,
      servicio: "Servicio Premium",
      barbero: "Carlos (Master)",
    },
  ]);

  const [citasAgendadas, setCitasAgendadas] = useState([
    {
      id: 99,
      cliente: "David G.",
      servicio: "Fade Premium",
      fecha: "Hoy - 17:30",
      barbero: "Juan (Jr)",
      total: 300,
      saldo: 200
    }
  ]);

  const aceptarCita = (cita) => {
    // Transformamos la cita pendiente al formato de cita agendada
    const nuevaAgendada = {
      id: cita.id,
      cliente: cita.cliente,
      servicio: cita.servicio,
      fecha: "Hoy - Por definir",
      barbero: cita.barbero,
      total: cita.total,
      saldo: cita.total - cita.anticipo
    };
    
    setCitasAgendadas([...citasAgendadas, nuevaAgendada]);
    setCitasPendientes(citasPendientes.filter((c) => c.id !== cita.id));
  };

  const rechazarCita = (id) => {
    setCitasPendientes(citasPendientes.filter((c) => c.id !== id));
  };

  return (
    <div className="agenda-wrapper">
      
      {/* Encabezado */}
      <div className="agenda-main-header">
        <h1>Gestión de Agenda Activa</h1>
        <p>Acepta o rechaza solicitudes de citas móviles y supervisa el pago de anticipos obligatorios.</p>
      </div>

      {/* Grid de Tarjetas */}
      <div className="agenda-cards-container">
        {citasPendientes.map((cita) => (
          <div className="agenda-card-box" key={cita.id}>
            
            {/* Fila superior: Nombre y Precio */}
            <div className="card-top-row">
              <h2 className="client-name">{cita.cliente}</h2>
              <span className="client-price">${cita.total}</span>
            </div>

            {/* Fila del anticipo */}
            <div className="card-badge-row">
              <div className="badge-green">
                Anticipo: ${cita.anticipo}
              </div>
            </div>

            {/* Caja amarilla de detalles */}
            <div className="card-details-box">
              <p><strong>Servicio solicitado:</strong> {cita.servicio}</p>
              <p><strong>Barbero solicitado:</strong> {cita.barbero}</p>
            </div>

            {/* Botones */}
            <div className="card-action-buttons">
              <button className="btn-accept" onClick={() => aceptarCita(cita)}>
                Aceptar
              </button>
              <button className="btn-reject" onClick={() => rechazarCita(cita.id)}>
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sección Citas Agendadas */}
      <div className="agendadas-section">
        <h2>CITAS AGENDADAS HOY</h2>
        
        <div className="agendadas-list">
          {citasAgendadas.map((agendada) => (
            <div className="agendada-row" key={agendada.id}>
              
              <div className="agendada-info">
                <strong>{agendada.cliente} ({agendada.servicio})</strong>
                <p>{agendada.fecha} • Asignado a: {agendada.barbero}</p>
              </div>

              <div className="agendada-finances">
                <div className="finances-text">
                  <p><strong>Total:</strong> ${agendada.total}</p>
                  <p><strong>Saldo pendiente:</strong> ${agendada.saldo}</p>
                </div>
                <button className="btn-ready">
                  Listo en agenda
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}