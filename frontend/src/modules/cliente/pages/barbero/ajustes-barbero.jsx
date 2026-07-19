import { useRef, useState } from "react";
import {
  Bell,
  Camera,
  Check,
  Clock3,
  KeyRound,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { getStoredUser } from "../../../../utils/api";
import "../../styles/barbero/ajustes-barbero.css";

const SETTINGS_KEY = "barberhub_barber_settings";
const PROFILE_KEY = "barberhub_barber_profile";

const readLocal = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
};

export default function AjustesBarbero() {
  const sessionUser = getStoredUser();
  const defaultProfile = {
    name: sessionUser?.nombre || "Barbero Principal",
    email: sessionUser?.email || "barbero@test.com",
    phone: "+52 222 000 0000",
    specialty: "Corte y barba",
    avatar: "",
  };
  const defaultSettings = {
    appointmentAlerts: true,
    cancellationAlerts: true,
    reviewAlerts: true,
    dailySummary: false,
    acceptingAppointments: true,
    autoAccept: false,
    twoFactor: false,
  };

  const [profile, setProfile] = useState(() => readLocal(PROFILE_KEY, defaultProfile));
  const [settings, setSettings] = useState(() => readLocal(SETTINGS_KEY, defaultSettings));
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const photoInput = useRef(null);

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const updateSetting = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  };

  const saveProfile = () => {
    const next = { ...profile, name: profile.name.trim(), phone: profile.phone.trim() };
    if (!next.name) {
      setNotice("Escribe tu nombre antes de guardar.");
      return;
    }
    setProfile(next);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setEditing(false);
    setNotice("Tus datos se guardaron en este dispositivo.");
  };

  const changePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Selecciona una imagen válida.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const next = { ...profile, avatar: reader.result };
      setProfile(next);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      setNotice("La foto se actualizó en este dispositivo.");
    };
    reader.readAsDataURL(file);
  };

  const savePassword = (event) => {
    event.preventDefault();
    if (passwords.password.length < 8) {
      setNotice("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (passwords.password !== passwords.confirm) {
      setNotice("Las contraseñas no coinciden.");
      return;
    }
    setPasswords({ password: "", confirm: "" });
    setPasswordOpen(false);
    setNotice("Contraseña validada. Se conectará al backend cuando esté disponible.");
  };

  return (
    <section className="ba-page">
      <div className="ba-heading">
        <div>
          <p className="ba-eyebrow">Panel del barbero</p>
          <h2>Configuración de cuenta</h2>
          <p>Personaliza tu perfil, disponibilidad y avisos de trabajo.</p>
        </div>
        {notice && <div className="ba-notice"><Check size={16} />{notice}</div>}
      </div>

      <div className="ba-grid">
        <aside className="ba-profile-column">
          <article className="ba-profile-card">
            <div className="ba-avatar-wrap">
              {profile.avatar ? <img src={profile.avatar} alt="Foto de perfil" /> : <span>{initials}</span>}
              <button type="button" className="ba-photo-fab" onClick={() => photoInput.current?.click()} aria-label="Cambiar foto de perfil"><Camera size={16} /></button>
            </div>
            <h3>{profile.name}</h3>
            <p>{profile.specialty}</p>
            <span className="ba-role-badge">Barbero</span>
          </article>

          <input ref={photoInput} className="ba-file-input" type="file" accept="image/*" onChange={changePhoto} />
          <button type="button" className="ba-outline-button" onClick={() => photoInput.current?.click()}><Camera size={17} />Cambiar foto</button>

          <div className="ba-stats">
            <div><strong>4.9</strong><span>Calificación</span></div>
            <div><strong>126</strong><span>Citas</span></div>
            <div><strong>98%</strong><span>Asistencia</span></div>
          </div>
        </aside>

        <div className="ba-settings-column">
          <article className="ba-card">
            <div className="ba-card-title"><UserRound size={20} /><div><h3>Datos personales</h3><p>Información visible para clientes y barbería.</p></div></div>
            <div className="ba-form-grid">
              <label>Nombre completo<input value={profile.name} disabled={!editing} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label>
              <label>Teléfono<input value={profile.phone} disabled={!editing} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></label>
              <label className="ba-full-field">Correo electrónico<input value={profile.email} disabled /></label>
              <label className="ba-full-field">Especialidad<input value={profile.specialty} disabled={!editing} onChange={(e) => setProfile({ ...profile, specialty: e.target.value })} /></label>
            </div>
            <div className="ba-card-actions">
              {editing ? <><button className="ba-text-button" type="button" onClick={() => setEditing(false)}>Cancelar</button><button className="ba-primary-button" type="button" onClick={saveProfile}><Save size={16} />Guardar cambios</button></> : <button className="ba-primary-button" type="button" onClick={() => setEditing(true)}>Editar información</button>}
            </div>
          </article>

          <article className="ba-card">
            <div className="ba-card-title"><Bell size={20} /><div><h3>Notificaciones</h3><p>Elige los avisos que quieres recibir.</p></div></div>
            <Toggle label="Nuevas solicitudes de cita" description="Te avisa cuando un cliente solicita una cita." checked={settings.appointmentAlerts} onChange={() => updateSetting("appointmentAlerts")} />
            <Toggle label="Cancelaciones y cambios" description="Recibe avisos cuando una cita cambia." checked={settings.cancellationAlerts} onChange={() => updateSetting("cancellationAlerts")} />
            <Toggle label="Nuevas opiniones" description="Te informa cuando un cliente deja una reseña." checked={settings.reviewAlerts} onChange={() => updateSetting("reviewAlerts")} />
            <Toggle label="Resumen diario" description="Recibe tu agenda al iniciar el día." checked={settings.dailySummary} onChange={() => updateSetting("dailySummary")} last />
          </article>

          <article className="ba-card">
            <div className="ba-card-title"><Clock3 size={20} /><div><h3>Agenda de trabajo</h3><p>Estas opciones se aplicarán a tus próximas citas.</p></div></div>
            <Toggle label="Aceptar nuevas citas" description="Permite que los clientes vean horarios disponibles contigo." checked={settings.acceptingAppointments} onChange={() => updateSetting("acceptingAppointments")} />
            <Toggle label="Confirmación automática" description="Las citas se confirmarán sin revisión manual." checked={settings.autoAccept} onChange={() => updateSetting("autoAccept")} last />
          </article>

          <article className="ba-card">
            <div className="ba-card-title"><ShieldCheck size={20} /><div><h3>Seguridad</h3><p>Protege el acceso a tu cuenta.</p></div></div>
            <div className="ba-action-row"><div><strong>Contraseña</strong><span>Actualiza tu contraseña de acceso.</span></div><button type="button" className="ba-outline-small" onClick={() => setPasswordOpen(true)}><KeyRound size={15} />Cambiar</button></div>
            <Toggle label="Verificación en dos pasos" description="Solicita una validación adicional al iniciar sesión." checked={settings.twoFactor} onChange={() => updateSetting("twoFactor")} last />
          </article>

          <div className="ba-danger-zone"><div><strong>Desactivar cuenta</strong><span>Esta acción requerirá confirmación con soporte cuando exista backend.</span></div><button type="button" onClick={() => setDeleteOpen(true)}><Trash2 size={16} />Desactivar</button></div>
        </div>
      </div>

      {passwordOpen && <div className="ba-modal-backdrop" role="presentation"><form className="ba-modal" onSubmit={savePassword}><button type="button" className="ba-modal-close" onClick={() => setPasswordOpen(false)} aria-label="Cerrar"><X size={18} /></button><KeyRound size={24} /><h3>Cambiar contraseña</h3><p>Por ahora validamos los datos localmente.</p><label>Nueva contraseña<input type="password" value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} required /></label><label>Confirmar contraseña<input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required /></label><button className="ba-primary-button" type="submit">Validar contraseña</button></form></div>}
      {deleteOpen && <div className="ba-modal-backdrop" role="presentation"><div className="ba-modal ba-delete-modal"><button type="button" className="ba-modal-close" onClick={() => setDeleteOpen(false)} aria-label="Cerrar"><X size={18} /></button><Trash2 size={24} /><h3>¿Deseas desactivar tu cuenta?</h3><p>No se eliminará información todavía. Esta acción se conectará con soporte cuando el backend esté listo.</p><div className="ba-modal-buttons"><button className="ba-text-button" type="button" onClick={() => setDeleteOpen(false)}>Cancelar</button><button className="ba-danger-button" type="button" onClick={() => { setDeleteOpen(false); setNotice("Solicitud de desactivación preparada; falta conectarla al backend."); }}>Entendido</button></div></div></div>}
    </section>
  );
}

function Toggle({ label, description, checked, onChange, last = false }) {
  return <div className={`ba-toggle-row ${last ? "ba-toggle-row-last" : ""}`}><div><strong>{label}</strong><span>{description}</span></div><label className="ba-switch"><input type="checkbox" checked={checked} onChange={onChange} /><span /></label></div>;
}
