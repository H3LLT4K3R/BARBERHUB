import { useEffect, useRef, useState } from "react";
import {
  User, MapPin, Trash2, Camera, Edit2, Check, Star, Image as ImageIcon,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import "../../styles/Barberias/perfilbarberia.css";

const DIAS_SEMANA = [
  { weekday: 1, label: "Lunes" },
  { weekday: 2, label: "Martes" },
  { weekday: 3, label: "Miércoles" },
  { weekday: 4, label: "Jueves" },
  { weekday: 5, label: "Viernes" },
  { weekday: 6, label: "Sábado" },
  { weekday: 0, label: "Domingo" },
];

const HORARIO_DEFAULT = { trabaja: false, starts_at: "09:00", ends_at: "20:00" };

function urlPublica(path) {
  if (!path) return null;
  return supabase.storage.from("perfiles").getPublicUrl(path).data.publicUrl;
}

export default function PerfilBarberiaBarbero() {
  const [cargando, setCargando] = useState(true);
  const [uid, setUid] = useState(null);
  const [membershipId, setMembershipId] = useState(null);
  const [barberia, setBarberia] = useState(null);
  const [nombre, setNombre] = useState("");
  const [avatarPath, setAvatarPath] = useState(null);
  const [horarios, setHorarios] = useState(() =>
    DIAS_SEMANA.map((d) => ({ weekday: d.weekday, ...HORARIO_DEFAULT }))
  );
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [fotos, setFotos] = useState([]);
  const [stats, setStats] = useState({ rating: 0, totalOpiniones: 0 });
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const avatarInputRef = useRef(null);
  const fotoInputRef = useRef(null);

  const obtenerEstado = async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data: membership } = await supabase
      .from("barberia_memberships")
      .select("id, barberia_id, barberias(name, city)")
      .eq("profile_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) return null;

    const [{ data: profile }, { data: disponibilidad }, { data: portafolio }, { data: reviews }] = await Promise.all([
      supabase.from("profiles").select("full_name, avatar_path").eq("id", userId).single(),
      supabase.from("staff_availability").select("weekday, starts_at, ends_at").eq("membership_id", membership.id),
      supabase.from("barber_portfolio_images").select("id, image_path").eq("membership_id", membership.id).order("created_at", { ascending: false }),
      supabase.from("reviews").select("rating").eq("barber_membership_id", membership.id).eq("is_published", true),
    ]);

    const horariosCargados = DIAS_SEMANA.map((d) => {
      const existente = disponibilidad?.find((h) => h.weekday === d.weekday);
      return existente
        ? { weekday: d.weekday, trabaja: true, starts_at: existente.starts_at.slice(0, 5), ends_at: existente.ends_at.slice(0, 5) }
        : { weekday: d.weekday, ...HORARIO_DEFAULT };
    });

    const calificaciones = reviews ?? [];

    return {
      userId,
      membership,
      profile,
      horarios: horariosCargados,
      portafolio: portafolio ?? [],
      stats: {
        rating: calificaciones.length ? calificaciones.reduce((acc, r) => acc + r.rating, 0) / calificaciones.length : 0,
        totalOpiniones: calificaciones.length,
      },
    };
  };

  const aplicarEstado = (estado) => {
    if (!estado) { setCargando(false); return; }
    setUid(estado.userId);
    setMembershipId(estado.membership.id);
    setBarberia(estado.membership.barberias);
    setNombre(estado.profile?.full_name ?? "");
    setAvatarPath(estado.profile?.avatar_path ?? null);
    setHorarios(estado.horarios);
    setFotos(estado.portafolio);
    setStats(estado.stats);
    setCargando(false);
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const estado = await obtenerEstado();
      if (!cancelado) aplicarEstado(estado);
    })();
    return () => { cancelado = true; };
  }, []);

  const recargar = async () => aplicarEstado(await obtenerEstado());

  const actualizarHorario = (weekday, campo, valor) => {
    setHorarios((prev) => prev.map((h) => (h.weekday === weekday ? { ...h, [campo]: valor } : h)));
  };

  const subirAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !uid) return;
    setGuardando(true);
    setMensaje("");
    try {
      const path = `avatars/${uid}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("perfiles").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", uid);
      if (updateError) throw updateError;

      setAvatarPath(path);
    } catch (err) {
      setMensaje(err.message || "No fue posible subir la foto.");
    } finally {
      setGuardando(false);
      event.target.value = "";
    }
  };

  const subirFotoPortafolio = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !membershipId) return;
    setSubiendoFoto(true);
    setMensaje("");
    try {
      const path = `portfolio/${membershipId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("perfiles").upload(path, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("barber_portfolio_images").insert({ membership_id: membershipId, image_path: path });
      if (insertError) throw insertError;

      await recargar();
    } catch (err) {
      setMensaje(err.message || "No fue posible subir la foto.");
    } finally {
      setSubiendoFoto(false);
      event.target.value = "";
    }
  };

  const eliminarFoto = async (foto) => {
    await supabase.storage.from("perfiles").remove([foto.image_path]);
    await supabase.from("barber_portfolio_images").delete().eq("id", foto.id);
    setFotos((prev) => prev.filter((f) => f.id !== foto.id));
  };

  const guardarCambios = async () => {
    setGuardando(true);
    setMensaje("");
    try {
      const { error: nombreError } = await supabase.from("profiles").update({ full_name: nombre }).eq("id", uid);
      if (nombreError) throw nombreError;

      const diasQueTrabajan = horarios.filter((h) => h.trabaja);
      const diasQueNoTrabajan = horarios.filter((h) => !h.trabaja);

      if (diasQueTrabajan.length) {
        const { error: upsertError } = await supabase
          .from("staff_availability")
          .upsert(
            diasQueTrabajan.map((h) => ({ membership_id: membershipId, weekday: h.weekday, starts_at: h.starts_at, ends_at: h.ends_at })),
            { onConflict: "membership_id,weekday" }
          );
        if (upsertError) throw upsertError;
      }

      if (diasQueNoTrabajan.length) {
        const { error: deleteError } = await supabase
          .from("staff_availability")
          .delete()
          .eq("membership_id", membershipId)
          .in("weekday", diasQueNoTrabajan.map((h) => h.weekday));
        if (deleteError) throw deleteError;
      }

      setIsEditingHours(false);
      setMensaje("Cambios guardados correctamente.");
    } catch (err) {
      setMensaje(err.message || "No fue posible guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="pagina-barberia-global"><p style={{ padding: 24 }}>Cargando tu perfil...</p></div>;
  }

  if (!membershipId) {
    return <div className="pagina-barberia-global"><p style={{ padding: 24 }}>Solo el personal de una barbería puede ver esta página.</p></div>;
  }

  return (
    <div className="pagina-barberia-global">
      <div className="perfil-clean-wrapper">
        <div className="barber-cards-row-grid-three">

          {/* COLUMNA 1: Avatar + nombre */}
          <div className="layout-column">
            <div className="card-profile-black">
              <div className="interactive-avatar" onClick={() => avatarInputRef.current?.click()}>
                {avatarPath ? (
                  <img src={urlPublica(avatarPath)} alt={nombre} className="avatar-img-preview" />
                ) : (
                  <User className="avatar-placeholder-icon" />
                )}
                <div className="avatar-hover-overlay"><Camera size={20} color="#fff" /></div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden-file-input" onChange={subirAvatar} />

              <div className="editable-name-container">
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="profile-title-name-input"
                  placeholder="Tu nombre..."
                />
              </div>

              <p className="profile-subtitle-geo">
                <MapPin className="inline-geo-icon" /> {barberia?.name} · {barberia?.city}
              </p>
            </div>

            <div className="card-white-container layout-column">
              <div className="horizontal-stats-header-bar">
                <div className="stat-segment"><span className="stat-top-lbl">Fotos</span><span className="stat-bottom-val">{fotos.length}</span></div>
                <div className="stat-segment border-x border-gray-100"><span className="stat-top-lbl">Días laborales</span><span className="stat-bottom-val">{horarios.filter((h) => h.trabaja).length}</span></div>
                <div className="stat-segment"><span className="stat-top-lbl">Calificación</span><span className="stat-bottom-val text-gold-rating"><Star size={12} style={{ display: "inline" }} /> {stats.rating.toFixed(1)} ({stats.totalOpiniones})</span></div>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: Horario individual + portafolio */}
          <div className="card-white-container layout-column" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="mb-4 bg-black-50 p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="sub-section-title m-0">Mi horario de trabajo</h4>
                  <button onClick={() => setIsEditingHours(!isEditingHours)} className={`modern-hours-toggle-btn ${isEditingHours ? "editing-active" : ""}`}>
                    {isEditingHours ? <><Check className="w-3 h-3" /> Listo</> : <><Edit2 className="w-3 h-3" /> Modificar</>}
                  </button>
                </div>
                <div className="working-hours-list-text">
                  {DIAS_SEMANA.map(({ weekday, label }) => {
                    const h = horarios.find((x) => x.weekday === weekday);
                    return (
                      <div className="hours-row mb-1" key={weekday}>
                        <span className="day-span-label">{label}</span>
                        {isEditingHours ? (
                          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <label style={{ fontSize: 10, display: "flex", gap: 4, alignItems: "center" }}>
                              <input type="checkbox" checked={h.trabaja} onChange={(e) => actualizarHorario(weekday, "trabaja", e.target.checked)} />
                              Trabajo este día
                            </label>
                            {h.trabaja && (
                              <>
                                <input type="time" value={h.starts_at} onChange={(e) => actualizarHorario(weekday, "starts_at", e.target.value)} className="inline-hours-editor-input" style={{ width: 90 }} />
                                <input type="time" value={h.ends_at} onChange={(e) => actualizarHorario(weekday, "ends_at", e.target.value)} className="inline-hours-editor-input" style={{ width: 90 }} />
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="hours-val">{h.trabaja ? `${h.starts_at} - ${h.ends_at}` : "No trabaja"}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <h4 className="sub-section-title-large">Portafolio de trabajos</h4>
              <div className="skills-image-display-grid">
                {fotos.map((foto) => (
                  <div key={foto.id} className="skill-photo-card">
                    <div className="skill-image-wrapper">
                      <img src={urlPublica(foto.image_path)} alt="Trabajo realizado" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div className="skill-card-footer-info">
                      <button type="button" className="delete-service-row-btn" onClick={() => eliminarFoto(foto)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <input ref={fotoInputRef} type="file" accept="image/*" className="hidden-file-input" onChange={subirFotoPortafolio} />
              <button type="button" className="clean-upload-trigger-btn" style={{ marginTop: 10 }} onClick={() => fotoInputRef.current?.click()} disabled={subiendoFoto}>
                <ImageIcon size={13} /> {subiendoFoto ? "Subiendo..." : "Añadir foto de un trabajo"}
              </button>
            </div>

            {mensaje && <p style={{ fontSize: 12, color: mensaje.includes("correctamente") ? "#15803d" : "#b91c1c", marginTop: 12 }}>{mensaje}</p>}
            <button className="btn-primary-gold mt-4" onClick={guardarCambios} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
