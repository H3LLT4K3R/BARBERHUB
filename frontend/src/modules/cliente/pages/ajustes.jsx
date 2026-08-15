import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Eye, EyeOff, Trash2 } from "lucide-react";
import { supabase } from "../../../lib/supabase.js";
import { apiFetch, clearSession } from "../../../utils/api.js";
import ImageLightbox from "../components/image-lightbox";
import "../styles/ajustes.css";

const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

function urlAvatar(path) {
  if (!path) return null;
  return supabase.storage.from("perfiles").getPublicUrl(path).data.publicUrl;
}

export default function Ajustes() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [email, setEmail] = useState("");
  const [nombreEditable, setNombreEditable] = useState("");
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [stats, setStats] = useState({ visitas: 0, calificacion: 0 });
  const [cargando, setCargando] = useState(true);

  const [recordatorio, setRecordatorio] = useState(true);
  const [citaConfirmada, setCitaConfirmada] = useState(true);
  const [nuevosCupones, setNuevosCupones] = useState(false);
  const [errorPreferencias, setErrorPreferencias] = useState("");

  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");
  const [borrarTodo, setBorrarTodo] = useState(false);

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const [fotoAmpliada, setFotoAmpliada] = useState(false);

  useEffect(() => {
    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        setCargando(false);
        return;
      }
      setEmail(userData.user.email);

      const [{ data: profileData }, { count: totalCompletadas }, { data: misResenas }, { data: preferencias }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, avatar_path").eq("id", uid).maybeSingle(),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("client_id", uid).eq("status", "completed"),
        supabase.from("reviews").select("rating").eq("client_id", uid),
        supabase.from("client_notification_preferences").select("*").eq("profile_id", uid).maybeSingle(),
      ]);

      setPerfil(profileData);
      setNombreEditable(profileData?.full_name ?? "");

      const calificaciones = misResenas ?? [];
      const calificacion = calificaciones.length ? calificaciones.reduce((acc, r) => acc + r.rating, 0) / calificaciones.length : 0;

      setStats({ visitas: totalCompletadas ?? 0, calificacion });

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

  const subirFoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!TIPOS_IMAGEN_PERMITIDOS.includes(file.type)) {
      setErrorFoto("Solo se aceptan imágenes JPG, PNG, WEBP o GIF.");
      event.target.value = "";
      return;
    }
    if (file.size > TAMANO_MAXIMO_BYTES) {
      setErrorFoto("La imagen no puede pesar más de 5 MB.");
      event.target.value = "";
      return;
    }

    setErrorFoto("");
    setSubiendoFoto(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;

      const path = `avatars/${uid}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("perfiles").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", uid);
      if (updateError) throw updateError;

      setPerfil((prev) => ({ ...prev, avatar_path: path }));
    } catch (error) {
      setErrorFoto(error.message || "No fue posible subir la foto.");
    } finally {
      setSubiendoFoto(false);
      event.target.value = "";
    }
  };

  const eliminarFoto = async () => {
    if (!perfil?.avatar_path) return;
    setErrorFoto("");
    setSubiendoFoto(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;

      await supabase.storage.from("perfiles").remove([perfil.avatar_path]);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", uid);
      if (updateError) throw updateError;

      setPerfil((prev) => ({ ...prev, avatar_path: null }));
    } catch (error) {
      setErrorFoto(error.message || "No fue posible eliminar la foto.");
    } finally {
      setSubiendoFoto(false);
    }
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

  const eliminarCuenta = async () => {
    setErrorEliminar("");
    setEliminando(true);
    try {
      await apiFetch("/perfil/cuenta", { method: "DELETE", body: JSON.stringify({ borrarTodo }) });
      await clearSession();
      navigate("/login", { replace: true, state: { mensaje: "Tu cuenta fue eliminada." } });
    } catch (error) {
      setErrorEliminar(error.message || "No fue posible eliminar la cuenta.");
      setEliminando(false);
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
            <div style={{ position: "relative", display: "inline-block" }}>
              {urlAvatar(perfil?.avatar_path) ? (
                <img
                  src={urlAvatar(perfil?.avatar_path)}
                  alt={perfil?.full_name ?? "Cliente"}
                  className="ajt-avatar"
                  style={{ objectFit: "cover", cursor: "pointer" }}
                  onClick={() => setFotoAmpliada(true)}
                  title="Ver foto"
                />
              ) : (
                <div className="ajt-avatar">{iniciales}</div>
              )}
              <label
                style={{
                  position: "absolute", right: -2, bottom: 12, width: 30, height: 30, borderRadius: "50%",
                  background: "#111827", color: "#e5be6b", border: "3px solid #fff", display: "flex",
                  alignItems: "center", justifyContent: "center", cursor: subiendoFoto ? "wait" : "pointer",
                }}
                title="Cambiar foto de perfil"
              >
                <Camera size={15} />
                <input type="file" accept="image/*" onChange={subirFoto} disabled={subiendoFoto} style={{ display: "none" }} />
              </label>
              {perfil?.avatar_path && (
                <button
                  type="button"
                  onClick={eliminarFoto}
                  disabled={subiendoFoto}
                  title="Eliminar foto de perfil"
                  style={{
                    position: "absolute", left: -2, bottom: 12, width: 30, height: 30, borderRadius: "50%",
                    background: "#fff", color: "#b90043", border: "3px solid #fff", display: "flex",
                    alignItems: "center", justifyContent: "center", cursor: subiendoFoto ? "wait" : "pointer",
                    boxShadow: "0 0 0 1px #e5e7eb",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <h3>{perfil?.full_name ?? "Cliente"}</h3>
            <p>{email}</p>
            {errorFoto && <p style={{ color: "#b90043", fontSize: 13, marginTop: 8 }}>{errorFoto}</p>}
          </div>

          <div className="ajt-grid-estadisticas">
            <button className="ajt-boton-estadistica" type="button">
              <strong>{stats.visitas}</strong>
              <span>Visitas</span>
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
                <div style={{ position: "relative" }}>
                  <input type={mostrarPassword ? "text" : "password"} style={{ width: "100%", paddingRight: 36 }} placeholder="Nueva contraseña" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required />
                  <button type="button" onClick={() => setMostrarPassword((v) => !v)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
                    {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input type={mostrarConfirm ? "text" : "password"} style={{ width: "100%", paddingRight: 36 }} placeholder="Confirmar contraseña" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required />
                  <button type="button" onClick={() => setMostrarConfirm((v) => !v)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}>
                    {mostrarConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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

          <section className="ajt-seccion">
            <h2>Zona de peligro</h2>

            {!confirmandoEliminar ? (
              <div className="ajt-zona-eliminar">
                <span className="ajt-texto-eliminar">Eliminar tu cuenta es permanente y no se puede deshacer.</span>
                <button type="button" className="ajt-boton-eliminar" onClick={() => setConfirmandoEliminar(true)}>
                  Eliminar mi cuenta
                </button>
              </div>
            ) : (
              <div className="ajt-zona-eliminar" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <span className="ajt-texto-eliminar">
                  Esta acción es permanente. Perderás el acceso a tu cuenta y a tus datos personales. Escribe <strong>ELIMINAR</strong> para confirmar.
                </span>
                <input
                  value={textoConfirmacion}
                  onChange={(e) => setTextoConfirmacion(e.target.value)}
                  placeholder="ELIMINAR"
                  disabled={eliminando}
                />
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.85rem", color: "#555" }}>
                  <input
                    type="checkbox"
                    checked={borrarTodo}
                    onChange={(e) => setBorrarTodo(e.target.checked)}
                    disabled={eliminando}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    Borrar todo permanentemente, incluso si tengo citas pasadas (opcional). Si no marcas esto, y ya
                    tienes historial de citas, tu cuenta se anonimiza en vez de borrarse por completo, para que la
                    barbería conserve su registro. Con esta opción marcada, tu nombre deja de estar ligado a esas
                    citas/reseñas/pagos, pero el registro en sí se conserva para la barbería.
                  </span>
                </label>
                {errorEliminar && <p style={{ color: "#b90043", margin: 0 }}>{errorEliminar}</p>}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="ajt-boton-eliminar"
                    disabled={textoConfirmacion.trim() !== "ELIMINAR" || eliminando}
                    onClick={eliminarCuenta}
                    style={{ opacity: textoConfirmacion.trim() !== "ELIMINAR" ? 0.5 : 1 }}
                  >
                    {eliminando ? "Eliminando..." : "Sí, eliminar mi cuenta"}
                  </button>
                  <button
                    type="button"
                    className="ajt-boton-editar-inline"
                    disabled={eliminando}
                    onClick={() => { setConfirmandoEliminar(false); setTextoConfirmacion(""); setErrorEliminar(""); }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {fotoAmpliada && (
        <ImageLightbox src={urlAvatar(perfil?.avatar_path)} alt={perfil?.full_name ?? "Cliente"} onClose={() => setFotoAmpliada(false)} />
      )}
    </div>
  );
}
