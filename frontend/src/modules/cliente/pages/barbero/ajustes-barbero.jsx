import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Clock3,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch } from "../../../../utils/api.js";
import "../../styles/barbero/ajustes-barbero.css";

export default function AjustesBarbero() {
  const [membership, setMembership] = useState(null);
  const [profile, setProfile] = useState({ name: "", phone: "", email: "", specialty: "" });
  const [settings, setSettings] = useState({
    appointmentAlerts: true,
    cancellationAlerts: true,
    reviewAlerts: true,
    dailySummary: false,
    acceptingAppointments: true,
    autoAccept: false,
  });
  const [stats, setStats] = useState({ calificacion: 0, citas: 0, asistencia: 0 });
  const [cargando, setCargando] = useState(true);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        setCargando(false);
        return;
      }

      const [{ data: profileData }, { data: membershipData }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", uid).maybeSingle(),
        supabase.from("barberia_memberships").select("id, specialty").eq("profile_id", uid).eq("is_active", true).limit(1).maybeSingle(),
      ]);

      setProfile({
        name: profileData?.full_name ?? "",
        phone: profileData?.phone ?? "",
        email: userData.user.email,
        specialty: membershipData?.specialty ?? "",
      });
      setMembership(membershipData);

      if (membershipData) {
        const [{ data: barberSettings }, { data: notifPrefs }, { data: reviews }, { data: appointments }] = await Promise.all([
          supabase.from("barber_settings").select("*").eq("membership_id", membershipData.id).maybeSingle(),
          supabase.from("barber_notification_preferences").select("*").eq("membership_id", membershipData.id).maybeSingle(),
          supabase.from("reviews").select("rating").eq("barber_membership_id", membershipData.id),
          supabase.from("appointments").select("status").eq("barber_membership_id", membershipData.id).in("status", ["completed", "no_show"]),
        ]);

        setSettings((prev) => ({
          ...prev,
          appointmentAlerts: notifPrefs?.new_appointment_alerts ?? true,
          cancellationAlerts: notifPrefs?.cancellation_alerts ?? true,
          reviewAlerts: notifPrefs?.review_alerts ?? true,
          dailySummary: notifPrefs?.daily_summary_alerts ?? false,
          acceptingAppointments: barberSettings?.accepting_appointments ?? true,
          autoAccept: barberSettings?.auto_accept_appointments ?? false,
        }));

        const calificacion = reviews?.length ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
        const completadas = (appointments ?? []).filter((a) => a.status === "completed").length;
        const asistencia = appointments?.length ? Math.round((completadas / appointments.length) * 100) : 100;
        setStats({ calificacion, citas: appointments?.length ?? 0, asistencia });
      }

      setCargando(false);
    }

    cargar();
  }, []);

  const initials = (profile.name || profile.email)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const updateBarberSetting = async (key, campoDb, tabla) => {
    if (!membership) return;
    const anterior = settings[key];
    const next = { ...settings, [key]: !anterior };
    setSettings(next);
    const { error } = await supabase.from(tabla).update({ [campoDb]: next[key] }).eq("membership_id", membership.id);
    if (error) {
      setSettings((prev) => ({ ...prev, [key]: anterior }));
      setNotice("No fue posible guardar el cambio.");
    }
  };

  const saveProfile = async () => {
    const nombre = profile.name.trim();
    if (!nombre) {
      setNotice("Escribe tu nombre antes de guardar.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ full_name: nombre, phone: profile.phone.trim() }).eq("id", userData.user.id);

    try {
      await apiFetch("/perfil/membresia", {
        method: "POST",
        body: JSON.stringify({ specialty: profile.specialty.trim() }),
      });
      setEditing(false);
      setNotice("Tus datos se guardaron correctamente.");
    } catch (err) {
      setNotice(err.message || "No fue posible guardar la especialidad.");
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (passwords.password.length < 8) {
      setNotice("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (passwords.password !== passwords.confirm) {
      setNotice("Las contraseñas no coinciden.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: passwords.password });
    if (error) {
      setNotice("No fue posible cambiar la contraseña.");
      return;
    }

    setPasswords({ password: "", confirm: "" });
    setPasswordOpen(false);
    setNotice("Contraseña actualizada correctamente.");
  };

  if (cargando) {
    return <section className="ba-page"><p>Cargando ajustes...</p></section>;
  }

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
              <span>{initials}</span>
            </div>
            <h3>{profile.name}</h3>
            <p>{profile.specialty}</p>
            <span className="ba-role-badge">Barbero</span>
          </article>

          <div className="ba-stats">
            <div><strong>{stats.calificacion.toFixed(1)}</strong><span>Calificación</span></div>
            <div><strong>{stats.citas}</strong><span>Citas</span></div>
            <div><strong>{stats.asistencia}%</strong><span>Asistencia</span></div>
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
              {editing ? (
                <>
                  <button className="ba-text-button" type="button" onClick={() => setEditing(false)}>Cancelar</button>
                  <button className="ba-primary-button" type="button" onClick={saveProfile}><Save size={16} />Guardar cambios</button>
                </>
              ) : (
                <button className="ba-primary-button" type="button" onClick={() => setEditing(true)}>Editar información</button>
              )}
            </div>
          </article>

          <article className="ba-card">
            <div className="ba-card-title"><Bell size={20} /><div><h3>Notificaciones</h3><p>Elige los avisos que quieres recibir.</p></div></div>
            <Toggle label="Nuevas solicitudes de cita" description="Te avisa cuando un cliente solicita una cita." checked={settings.appointmentAlerts} onChange={() => updateBarberSetting("appointmentAlerts", "new_appointment_alerts", "barber_notification_preferences")} />
            <Toggle label="Cancelaciones y cambios" description="Recibe avisos cuando una cita cambia." checked={settings.cancellationAlerts} onChange={() => updateBarberSetting("cancellationAlerts", "cancellation_alerts", "barber_notification_preferences")} />
            <Toggle label="Nuevas opiniones" description="Te informa cuando un cliente deja una reseña." checked={settings.reviewAlerts} onChange={() => updateBarberSetting("reviewAlerts", "review_alerts", "barber_notification_preferences")} />
            <Toggle label="Resumen diario" description="Recibe tu agenda al iniciar el día." checked={settings.dailySummary} onChange={() => updateBarberSetting("dailySummary", "daily_summary_alerts", "barber_notification_preferences")} last />
          </article>

          <article className="ba-card">
            <div className="ba-card-title"><Clock3 size={20} /><div><h3>Agenda de trabajo</h3><p>Estas opciones se aplicarán a tus próximas citas.</p></div></div>
            <Toggle label="Aceptar nuevas citas" description="Permite que los clientes vean horarios disponibles contigo." checked={settings.acceptingAppointments} onChange={() => updateBarberSetting("acceptingAppointments", "accepting_appointments", "barber_settings")} />
            <Toggle label="Confirmación automática" description="Las citas se confirmarán sin revisión manual." checked={settings.autoAccept} onChange={() => updateBarberSetting("autoAccept", "auto_accept_appointments", "barber_settings")} last />
          </article>

          <article className="ba-card">
            <div className="ba-card-title"><ShieldCheck size={20} /><div><h3>Seguridad</h3><p>Protege el acceso a tu cuenta.</p></div></div>
            <div className="ba-action-row"><div><strong>Contraseña</strong><span>Actualiza tu contraseña de acceso.</span></div><button type="button" className="ba-outline-small" onClick={() => setPasswordOpen(true)}><KeyRound size={15} />Cambiar</button></div>
          </article>

          <div className="ba-danger-zone">
            <div><strong>Desactivar cuenta</strong><span>Esta acción requiere contactar a soporte; aún no está disponible desde la app.</span></div>
            <button type="button" onClick={() => setDeleteOpen(true)}><Trash2 size={16} />Desactivar</button>
          </div>
        </div>
      </div>

      {passwordOpen && (
        <div className="ba-modal-backdrop" role="presentation">
          <form className="ba-modal" onSubmit={savePassword}>
            <button type="button" className="ba-modal-close" onClick={() => setPasswordOpen(false)} aria-label="Cerrar"><X size={18} /></button>
            <KeyRound size={24} />
            <h3>Cambiar contraseña</h3>
            <label>Nueva contraseña
              <span style={{ position: "relative", display: "block" }}>
                <input type={mostrarPassword ? "text" : "password"} style={{ width: "100%", paddingRight: 32 }} value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })} required />
                <button type="button" onClick={() => setMostrarPassword((v) => !v)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
                  {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            <label>Confirmar contraseña
              <span style={{ position: "relative", display: "block" }}>
                <input type={mostrarConfirm ? "text" : "password"} style={{ width: "100%", paddingRight: 32 }} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
                <button type="button" onClick={() => setMostrarConfirm((v) => !v)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
                  {mostrarConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>
            <button className="ba-primary-button" type="submit">Guardar contraseña</button>
          </form>
        </div>
      )}
      {deleteOpen && (
        <div className="ba-modal-backdrop" role="presentation">
          <div className="ba-modal ba-delete-modal">
            <button type="button" className="ba-modal-close" onClick={() => setDeleteOpen(false)} aria-label="Cerrar"><X size={18} /></button>
            <Trash2 size={24} />
            <h3>¿Deseas desactivar tu cuenta?</h3>
            <p>Esta función todavía no está conectada. Contacta al dueño de la barbería o a soporte para desactivar tu cuenta.</p>
            <div className="ba-modal-buttons">
              <button className="ba-text-button" type="button" onClick={() => setDeleteOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Toggle({ label, description, checked, onChange, last = false }) {
  return (
    <div className={`ba-toggle-row ${last ? "ba-toggle-row-last" : ""}`}>
      <div><strong>{label}</strong><span>{description}</span></div>
      <label className="ba-switch"><input type="checkbox" checked={checked} onChange={onChange} /><span /></label>
    </div>
  );
}
