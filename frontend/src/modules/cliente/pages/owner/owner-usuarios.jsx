import React, { useState } from "react";
import { UserPlus, Shield, Scissors, Trash2, Edit2, Check, X, Lock, Eye, EyeOff } from "lucide-react";
import '../../styles/owner/owner-usuarios.css';

export default function OwnerUsuarios() {
  // 1. Estados para el formulario de NUEVA cuenta
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "barbero"
  });
  
  // Estado para ver/ocultar contraseña en el formulario de creación
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // 2. Estado para la lista de cuentas
  const [cuentas, setCuentas] = useState([
    { id: 1, nombre: "Yael S.", email: "admin@barberhub.com", password: "", rol: "admin", estado: "Activa" },
    { id: 2, nombre: "Carlos Méndez", email: "carlos@barberhub.com", password: "", rol: "barbero", estado: "Activa" },
    { id: 3, nombre: "Luis Torres", email: "luis@barberhub.com", password: "", rol: "barbero", estado: "Inactiva" }
  ]);

  // 3. Estados para controlar el MODO EDICIÓN
  const [editandoId, setEditandoId] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({});
  // Estado para ver/ocultar contraseña en el modo edición
  const [mostrarEditPassword, setMostrarEditPassword] = useState(false);

  // -- FUNCIONES DE LÓGICA --

  const handleCrearCuenta = () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) return; 
    
    const nuevaCuenta = {
      id: Date.now(),
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      password: nuevoUsuario.password,
      rol: nuevoUsuario.rol,
      estado: "Activa"
    };

    setCuentas([...cuentas, nuevaCuenta]);
    
    // Limpiar formulario y ocultar contraseña
    setNuevoUsuario({ nombre: "", email: "", password: "", rol: "barbero" });
    setMostrarPassword(false);
  };

  const handleEliminarCuenta = (id) => {
    setCuentas(cuentas.filter(cuenta => cuenta.id !== id));
  };

  const iniciarEdicion = (cuenta) => {
    setEditandoId(cuenta.id);
    setDatosEdicion({ ...cuenta, password: "" }); 
    setMostrarEditPassword(false); // Asegura que empiece oculta al editar
  };

  const guardarEdicion = () => {
    setCuentas(cuentas.map(c => c.id === editandoId ? datosEdicion : c));
    setEditandoId(null);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
  };

  return (
    <div className="owner-usuarios-container">
      <h1 className="owner-usuarios-title">Gestión de Cuentas</h1>
      <p className="owner-usuarios-description">
        Crea y administra los accesos para tus barberos y administradores.
      </p>

      {/* TARJETA: FORMULARIO CREAR CUENTA */}
      <div className="owner-usuarios-card" style={{ marginBottom: "2rem" }}>
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
              value={nuevoUsuario.nombre}
              onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
            />
          </div>

          <div>
            <label className="owner-usuarios-label">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              className="owner-usuarios-input"
              value={nuevoUsuario.email}
              onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
            />
          </div>

          {/* CAMPO: CONTRASEÑA CON BOTÓN DE VISIBILIDAD */}
          <div>
            <label className="owner-usuarios-label">Contraseña de Acceso</label>
            <div style={{ position: "relative" }}>
              <input 
                type={mostrarPassword ? "text" : "password"} 
                placeholder="Mínimo 8 caracteres" 
                className="owner-usuarios-input"
                style={{ paddingRight: "40px" }} // Espacio para que el texto no pise el icono
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  padding: 0
                }}
              >
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="owner-usuarios-label">Rol del Usuario</label>
            <div className="owner-usuarios-role-container">
              <button 
                type="button"
                onClick={() => setNuevoUsuario({...nuevoUsuario, rol: "barbero"})}
                className={`owner-usuarios-role-btn ${nuevoUsuario.rol === "barbero" ? "active" : ""}`}
              >
                <Scissors size={18} /> Barbero
              </button>
              <button 
                type="button"
                onClick={() => setNuevoUsuario({...nuevoUsuario, rol: "admin"})}
                className={`owner-usuarios-role-btn ${nuevoUsuario.rol === "admin" ? "active" : ""}`}
              >
                <Shield size={18} /> Administrador
              </button>
            </div>
          </div>

          <button 
            type="button" 
            className="owner-usuarios-submit-btn"
            onClick={handleCrearCuenta}
          >
            Crear Cuenta
          </button>
        </form>
      </div>

      {/* TARJETA: LISTA DE CUENTAS */}
      <div className="card-white-container">
        <h3 className="sub-section-title-large">Cuentas Registradas</h3>

        <div className="accounts-list-stack">
          {cuentas.map((cuenta) => (
            <div key={cuenta.id} className="account-row-card">
              
              {/* MODO EDICIÓN */}
              {editandoId === cuenta.id ? (
                <div className="account-edit-mode">
                  <input 
                    type="text" 
                    placeholder="Nombre"
                    className="add-account-input" 
                    value={datosEdicion.nombre}
                    onChange={(e) => setDatosEdicion({...datosEdicion, nombre: e.target.value})}
                  />
                  <input 
                    type="email" 
                    placeholder="Correo"
                    className="add-account-input" 
                    value={datosEdicion.email}
                    onChange={(e) => setDatosEdicion({...datosEdicion, email: e.target.value})}
                  />
                  
                  {/* Campo de contraseña en edición CON VISIBILIDAD */}
                  <div style={{ position: "relative", flex: 1, minWidth: "140px" }}>
                    <Lock size={14} color="#9ca3af" style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      type={mostrarEditPassword ? "text" : "password"} 
                      placeholder="Nueva contraseña"
                      className="add-account-input" 
                      style={{ paddingLeft: "28px", paddingRight: "30px", width: "100%", boxSizing: "border-box" }}
                      value={datosEdicion.password}
                      onChange={(e) => setDatosEdicion({...datosEdicion, password: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarEditPassword(!mostrarEditPassword)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#9ca3af",
                        display: "flex",
                        alignItems: "center",
                        padding: 0
                      }}
                    >
                      {mostrarEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  <select 
                    className="add-account-select"
                    value={datosEdicion.rol}
                    onChange={(e) => setDatosEdicion({...datosEdicion, rol: e.target.value})}
                  >
                    <option value="barbero">Barbero</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select 
                    className="add-account-select"
                    value={datosEdicion.estado}
                    onChange={(e) => setDatosEdicion({...datosEdicion, estado: e.target.value})}
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                  </select>

                  <div className="account-actions-group">
                    <button className="action-icon-btn save" onClick={guardarEdicion}>
                      <Check size={18} />
                    </button>
                    <button className="action-icon-btn cancel" onClick={cancelarEdicion}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                /* MODO VISTA NORMAL */
                <>
                  <div className="account-info-col">
                    <span className="account-name-text">{cuenta.nombre}</span>
                    <span className="account-email-text">{cuenta.email}</span>
                  </div>
                  
                  <div className="account-badges-group">
                    <span className={`status-badge ${cuenta.estado === "Activa" ? "is-active" : "is-inactive"}`}>
                      <div className="status-dot"></div> {cuenta.estado}
                    </span>
                    <span className={`account-role-badge ${cuenta.rol === "admin" ? "role-admin" : "role-barber"}`}>
                      {cuenta.rol === "admin" ? "Admin" : "Barbero"}
                    </span>
                  </div>
                  
                  <div className="account-actions-group">
                    <button className="action-icon-btn edit" onClick={() => iniciarEdicion(cuenta)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="action-icon-btn delete" onClick={() => handleEliminarCuenta(cuenta.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {cuentas.length === 0 && (
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: "14px", padding: "16px" }}>
              No hay cuentas registradas.
            </p>
          )}

        </div>
      </div>
      
    </div>
  );
}