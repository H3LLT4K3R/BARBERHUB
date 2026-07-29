import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase.js";
import "../styles/ajustes.css";

export default function Ajustes() {
  const [perfil, setPerfil] = useState(null);
  const [email, setEmail] = useState("");
  const [nombreEditable, setNombreEditable] = useState("");
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [stats, setStats] = useState({ visitas: 0, puntos: 0, calificacion: 0 });
  const [cargando, setCargando] = useState(true);

  const [recordatorio, setRecordatorio] = useState(true);
  const [citaConfirmada, setCitaConfirmada] = useState(true);
  const [nuevosCupones, setNuevosCupones] = useState(false);
  const [errorPreferencias, setErrorPreferencias] = useState("");

  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        setCargando(false);
        return;
      }
      setEmail(userData.user.email);

      const [{ data: profileData }, { count: totalCompletadas }, { data: loyalty }, { data: misResenas }, { data: preferencias }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", uid).maybeSingle(),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("client_id", uid).eq("status", "completed"),
        supabase.from("loyalty_accounts").select("points_balance").eq("profile_id", uid),
        supabase.from("reviews").select("rating").eq("client_id", uid),
        supabase.from("client_notification_preferences").select("*").eq("profile_id", uid).maybeSingle(),
      ]);

      setPerfil(profileData);
      setNombreEditable(profileData?.full_name ?? "");

      const puntos = (loyalty ?? []).reduce((acc, l) => acc + l.points_balance, 0);
      const calificaciones = misResenas ?? [];
      const calificacion = calificaciones.length ? calificaciones.reduce((acc, r) => acc + r.rating, 0) / calificaciones.length : 0;

      setStats({ visitas: totalCompletadas ?? 0, puntos, calificacion });

      if (preferencias) {
        setRecordatorio(preferencias.appointment_reminders);
        setCitaConfirmada(preferencias.appointment_confirmed_alerts);
        setNuevosCupones(preferencias.new_coupon_alerts);
      }

      setCargando(false);
    }

    cargar();
  }, []);

  const actualizarPreferencia = async (campoDb, valorAnterior, valorNuevo, aplicarLocal) => {
    aplicarLocal(valorNuevo);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("client_notification_preferences").update({ [campoDb]: valorNuevo }).eq("profile_id", uid);
    if (error) {
      aplicarLocal(valorAnterior);
      setErrorPreferencias("No fue posible guardar el cambio.");
    }
  };

  const guardarNombre = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid || !nombreEditable.trim()) return;

    await supabase.from("profiles").update({ full_name: nombreEditable.trim() }).eq("id", uid);
    setPerfil((prev) => ({ ...prev, full_name: nombreEditable.trim() }));
    setEditandoNombre(false);
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setMensajePassword("");

    if (nuevaPassword !== confirmarPassword) {
      setMensajePassword("Las contraseñas no coinciden.");
      return;
    }
    if (nuevaPassword.length < 8) {
      setMensajePassword("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    if (error) {
      setMensajePassword("No fue posible cambiar la contraseña.");
    } else {
      setMensajePassword("Contraseña actualizada correctamente.");
      setNuevaPassword("");
      setConfirmarPassword("");
      setCambiandoPassword(false);
    }
  };

  const iniciales = (perfil?.full_name ?? email)
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (cargando) {
    return <div className="ajt-contenido"><p>Cargando ajustes...</p></div>;
  }

  return (
    <div className="ajt-contenido">
      <div className="ajt-grid">
        <div className="ajt-columna-izquierda">
          <div className="ajt-tarjeta-perfil">
            <div className="ajt-avatar">{iniciales}</div>
            <h3>{perfil?.full_name ?? "Cliente"}</h3>
            <p>{email}</p>
          </div>

          <div className="ajt-grid-estadisticas">
            <button className="ajt-boton-estadistica" type="button">
              <strong>{stats.visitas}</strong>
              <span>Visitas</span>
            </button>
            <button className="ajt-boton-estadistica" type="button">
              <strong>{stats.puntos}</strong>
              <span>Puntos</span>
            </button>
            <button className="ajt-boton-estadistica" type="button">
              <strong>{stats.calificacion.toFixed(1)}</strong>
              <span>Calificación</span>
            </button>
          </div>
        </div>

        <div className="ajt-columna-derecha">
          <section className="ajt-seccion">
            <h2>Notificaciones</h2>
            {errorPreferencias && <p style={{ color: "#b91c1c" }}>{errorPreferencias}</p>}

            <div className="ajt-fila-ajuste">
              <div className="ajt-etiqueta"><span>Recordatorio de cita</span></div>
              <label className="ajt-switch">
                <input type="checkbox" checked={recordatorio} onChange={() => actualizarPreferencia("appointment_reminders", recordatorio, !recordatorio, setRecordatorio)} />
                <span className="ajt-slider"></span>
              </label>
            </div>

            <div className="ajt-fila-ajuste">
              <div className="ajt-etiqueta"><span>Cita confirmada</span></div>
              <label className="ajt-switch">
                <input type="checkbox" checked={citaConfirmada} onChange={() => actualizarPreferencia("appointment_confirmed_alerts", citaConfirmada, !citaConfirmada, setCitaConfirmada)} />
                <span className="ajt-slider"></span>
              </label>
            </div>

            <div className="ajt-fila-ajuste">
              <div className="ajt-etiqueta"><span>Nuevos cupones</span></div>
              <label className="ajt-switch">
                <input type="checkbox" checked={nuevosCupones} onChange={() => actualizarPreferencia("new_coupon_alerts", nuevosCupones, !nuevosCupones, setNuevosCupones)} />
                <span className="ajt-slider"></span>
              </label>
            </div>
          </section>

          <section className="ajt-seccion">
            <h2>Seguridad</h2>

            <div className="ajt-fila-ajuste">
              <div className="ajt-etiqueta"><span>Contraseña</span></div>
              <div className="ajt-acciones-password">
                <span className="ajt-dots-password">..........</span>
                <button className="ajt-boton-editar-inline" onClick={() => setCambiandoPassword((v) => !v)}>
                  {cambiandoPassword ? "Cancelar" : "Editar"}
                </button>
              </div>
            </div>

            {cambiandoPassword && (
              <form onSubmit={cambiarPassword} className="ajt-fila-ajuste" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <input type="password" placeholder="Nueva contraseña" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required />
                <input type="password" placeholder="Confirmar contraseña" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required />
                {mensajePassword && <p style={{ margin: 0 }}>{mensajePassword}</p>}
                <button type="submit" className="ajt-boton-editar-inline">Guardar contraseña</button>
              </form>
            )}
            {!cambiandoPassword && mensajePassword && <p>{mensajePassword}</p>}
          </section>

          <section className="ajt-seccion">
            <h2>Datos personales</h2>

            <div className="ajt-fila-info">
              <div className="ajt-etiqueta"><span>Nombre</span></div>
              {editandoNombre ? (
                <div className="ajt-acciones-password">
                  <input value={nombreEditable} onChange={(e) => setNombreEditable(e.target.value)} />
                  <button className="ajt-boton-editar-inline" onClick={guardarNombre}>Guardar</button>
                </div>
              ) : (
                <div className="ajt-acciones-password">
                  <span className="ajt-valor-info">{perfil?.full_name}</span>
                  <button className="ajt-boton-editar-inline" onClick={() => setEditandoNombre(true)}>Editar</button>
                </div>
              )}
            </div>

            <div className="ajt-fila-info">
              <div className="ajt-etiqueta"><span>Correo</span></div>
              <span className="ajt-valor-info">{email}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
