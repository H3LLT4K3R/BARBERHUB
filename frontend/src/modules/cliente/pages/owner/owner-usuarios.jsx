import { useEffect, useState } from "react";
import { UserPlus, Shield, Scissors, KeyRound, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch } from "../../../../utils/api.js";
import { evaluarPassword } from "../../../../utils/passwordStrength.js";
import PasswordStrength from "../../components/password-strength.jsx";
import '../../styles/owner/owner-usuarios.css';

export default function OwnerUsuarios() {
  const [barberias, setBarberias] = useState([]);
  const [barberiaId, setBarberiaId] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoEquipo, setCargandoEquipo] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", email: "", password: "", rol: "barber" });
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [membershipPassword, setMembershipPassword] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [mostrarEditPassword, setMostrarEditPassword] = useState(false);

  const cargarEquipo = async (bid) => {
    const { miembros } = await apiFetch(`/equipo?barberiaId=${bid}`);
    setCuentas(miembros ?? []);
  };

  useEffect(() => {
    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: memberships } = await supabase
        .from("barberia_memberships")
        .select("barberia_id, barberias(id, name)")
        .eq("profile_id", uid)
        .eq("role", "owner")
        .eq("is_active", true);

      const misBarberias = (memberships ?? [])
        .map((m) => m.barberias)
        .filter(Boolean);

      if (misBarberias.length === 0) {
        setCargando(false);
        return;
      }

      setBarberias(misBarberias);
      setBarberiaId(misBarberias[0].id);
      await cargarEquipo(misBarberias[0].id);
      setCargando(false);
    }

    cargar();
  }, []);

  const cambiarBarberiaSeleccionada = async (nuevoId) => {
    setBarberiaId(nuevoId);
    setCargandoEquipo(true);
    await cargarEquipo(nuevoId);
    setCargandoEquipo(false);
  };

  const handleCrearCuenta = async () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password || !barberiaId) return;

    const { valida } = evaluarPassword(nuevoUsuario.password);
    if (!valida) {
      setError("La contraseña debe tener al menos 8 caracteres, una letra, un número y un símbolo.");
      return;
    }

    setEnviando(true);
    setError("");

    try {
      await apiFetch("/equipo", {
        method: "POST",
        body: JSON.stringify({
          barberiaId,
          fullName: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          password: nuevoUsuario.password,
          role: nuevoUsuario.rol,
        }),
      });
      setNuevoUsuario({ nombre: "", email: "", password: "", rol: "barber" });
      setMostrarPassword(false);
      await cargarEquipo(barberiaId);
    } catch (err) {
      setError(err.message || "No fue posible crear la cuenta.");
    } finally {
      setEnviando(false);
    }
  };

  const alternarActiva = async (cuenta) => {
    await supabase.from("barberia_memberships").update({ is_active: !cuenta.is_active }).eq("id", cuenta.id);
    await cargarEquipo(barberiaId);
  };

  const restablecerPassword = async () => {
    if (!membershipPassword) return;

    const { valida } = evaluarPassword(nuevaPassword);
    if (!valida) {
      setError("La contraseña debe tener al menos 8 caracteres, una letra, un número y un símbolo.");
      return;
    }

    setEnviando(true);
    setError("");
    try {
      await apiFetch(`/equipo/${membershipPassword.id}/password`, {
        method: "POST",
        body: JSON.stringify({ password: nuevaPassword }),
      });
      setMembershipPassword(null);
      setNuevaPassword("");
    } catch (err) {
      setError(err.message || "No fue posible restablecer la contraseña.");
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return <div className="owner-usuarios-container"><p>Cargando equipo...</p></div>;
  }

  if (!barberiaId) {
    return <div className="owner-usuarios-container"><p>Solo el dueño de la barbería puede gestionar cuentas.</p></div>;
  }

  return (
    <div className="owner-usuarios-container">
      <h1 className="owner-usuarios-title">Gestión de Cuentas</h1>
      <p className="owner-usuarios-description">
        Crea y administra los accesos para tus barberos y administradores.
      </p>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <div className="owner-usuarios-card" style={{ marginBottom: "2rem" }}>
        <div className="owner-usuarios-card-header">
          <UserPlus size={24} color="#D4AF37" />
          <h2 className="owner-usuarios-card-title">Registrar Nuevo Usuario</h2>
        </div>

        <form className="owner-usuarios-form">
          <div>
            <label className="owner-usuarios-label">Barbería</label>
            <select
              className="owner-usuarios-input"
              value={barberiaId ?? ""}
              onChange={(e) => cambiarBarberiaSeleccionada(e.target.value)}
            >
              {barberias.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              La cuenta que registres quedará ligada únicamente a esta barbería: un barbero o administrador solo puede pertenecer a una a la vez.
            </p>
          </div>

          <div>
            <label className="owner-usuarios-label">Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej. Juan Pérez"
              className="owner-usuarios-input"
              value={nuevoUsuario.nombre}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
            />
          </div>

          <div>
            <label className="owner-usuarios-label">Correo Electrónico</label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="owner-usuarios-input"
              value={nuevoUsuario.email}
              onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
            />
          </div>

          <div>
            <label className="owner-usuarios-label">Contraseña de Acceso</label>
            <div style={{ position: "relative" }}>
              <input
                type={mostrarPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                className="owner-usuarios-input"
                style={{ paddingRight: "40px" }}
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center", padding: 0 }}
              >
                {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <PasswordStrength password={nuevoUsuario.password} />
          </div>

          <div>
            <label className="owner-usuarios-label">Rol del Usuario</label>
            <div className="owner-usuarios-role-container">
              <button type="button" onClick={() => setNuevoUsuario({ ...nuevoUsuario, rol: "barber" })} className={`owner-usuarios-role-btn ${nuevoUsuario.rol === "barber" ? "active" : ""}`}>
                <Scissors size={18} /> Barbero
              </button>
              <button type="button" onClick={() => setNuevoUsuario({ ...nuevoUsuario, rol: "admin" })} className={`owner-usuarios-role-btn ${nuevoUsuario.rol === "admin" ? "active" : ""}`}>
                <Shield size={18} /> Administrador
              </button>
            </div>
          </div>

          <button type="button" className="owner-usuarios-submit-btn" onClick={handleCrearCuenta} disabled={enviando}>
            {enviando ? "Creando..." : "Crear Cuenta"}
          </button>
        </form>
      </div>

      <div className="card-white-container">
        <h3 className="sub-section-title-large">Cuentas Registradas</h3>

        <div className="accounts-list-stack">
          {cargandoEquipo && (
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: "14px", padding: "16px" }}>
              Cargando equipo...
            </p>
          )}
          {!cargandoEquipo && cuentas.map((cuenta) => (
            <div key={cuenta.id} className="account-row-card">
              <div className="account-info-col">
                <span className="account-name-text">{cuenta.display_name ?? cuenta.email}</span>
                <span className="account-email-text">{cuenta.email}</span>
              </div>

              <div className="account-badges-group">
                <button type="button" className={`status-badge ${cuenta.is_active ? "is-active" : "is-inactive"}`} onClick={() => alternarActiva(cuenta)}>
                  <div className="status-dot"></div> {cuenta.is_active ? "Activa" : "Inactiva"}
                </button>
                <span className={`account-role-badge ${cuenta.role === "admin" ? "role-admin" : "role-barber"}`}>
                  {cuenta.role === "admin" ? "Admin" : "Barbero"}
                </span>
              </div>

              <div className="account-actions-group">
                <button className="action-icon-btn edit" onClick={() => { setMembershipPassword(cuenta); setNuevaPassword(""); setMostrarEditPassword(false); }} title="Restablecer contraseña">
                  <KeyRound size={16} />
                </button>
              </div>
            </div>
          ))}

          {!cargandoEquipo && cuentas.length === 0 && (
            <p style={{ textAlign: "center", color: "#6b7280", fontSize: "14px", padding: "16px" }}>
              No hay cuentas registradas.
            </p>
          )}
        </div>
      </div>

      {membershipPassword && (
        <div className="owner-usuarios-card" style={{ marginTop: "1.5rem" }}>
          <h3 className="sub-section-title-large">Restablecer contraseña de {membershipPassword.display_name ?? membershipPassword.email}</h3>
          <div style={{ position: "relative", maxWidth: 320 }}>
            <input
              type={mostrarEditPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              className="owner-usuarios-input"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />
            <button type="button" onClick={() => setMostrarEditPassword(!mostrarEditPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
              {mostrarEditPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <PasswordStrength password={nuevaPassword} />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="owner-usuarios-submit-btn" onClick={restablecerPassword} disabled={enviando}>Guardar</button>
            <button className="owner-usuarios-submit-btn" onClick={() => setMembershipPassword(null)} style={{ background: "#e5e7eb", color: "#111" }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
