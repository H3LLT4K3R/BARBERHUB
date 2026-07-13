import React, { useState } from "react";
import { UserPlus, Shield, Scissors } from "lucide-react";
// Importamos el CSS que acabamos de crear (asegúrate de que la ruta sea correcta)
import '../../styles/owner/owner-usuarios.css'; 

export default function OwnerUsuarios() {
  const [rol, setRol] = useState("barbero");

  return (
    <div className="owner-usuarios-container">
      <h1 className="owner-usuarios-title">Gestión de Cuentas</h1>
      <p className="owner-usuarios-description">
        Crea y administra los accesos para tus barberos y administradores.
      </p>

      {/* Tarjeta del Formulario */}
      <div className="owner-usuarios-card">
        <div className="owner-usuarios-card-header">
          <UserPlus size={24} color="#D4AF37" />
          <h2 className="owner-usuarios-card-title">Registrar Nuevo Usuario</h2>
        </div>

        <form className="owner-usuarios-form">
          <div>
            <label className="owner-usuarios-label">Nombre Completo</label>
            <input 
              type="text" 
              placeholder="Ej. Juan Pérez" 
              className="owner-usuarios-input"
            />
          </div>

          <div>
            <label className="owner-usuarios-label">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              className="owner-usuarios-input"
            />
          </div>

          <div>
            <label className="owner-usuarios-label">Rol del Usuario</label>
            <div className="owner-usuarios-role-container">
              <button 
                type="button"
                onClick={() => setRol("barbero")}
                // Si el rol es barbero, le agrega la clase 'active' para pintarlo de negro
                className={`owner-usuarios-role-btn ${rol === "barbero" ? "active" : ""}`}
              >
                <Scissors size={18} /> Barbero
              </button>
              <button 
                type="button"
                onClick={() => setRol("admin")}
                // Si el rol es admin, le agrega la clase 'active' para pintarlo de negro
                className={`owner-usuarios-role-btn ${rol === "admin" ? "active" : ""}`}
              >
                <Shield size={18} /> Administrador
              </button>
            </div>
          </div>

          <button type="button" className="owner-usuarios-submit-btn">
            Crear Cuenta
          </button>
        </form>
      </div>
    </div>
  );
}