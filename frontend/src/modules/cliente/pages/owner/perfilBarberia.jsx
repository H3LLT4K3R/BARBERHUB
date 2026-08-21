import { useEffect, useRef, useState } from "react";
import {
  User, MapPin, Plus, Trash2, Scissors, Edit2, Check, Star, Users, Camera, ExternalLink,
} from "lucide-react";

import "../../styles/Barberias/perfilbarberia.css";
import { supabase } from "../../../../lib/supabase.js";
import { ESTADOS, ciudadesDe, zonasDe } from "../../data/ubicaciones.js";

const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

function urlPublica(path) {
  if (!path) return null;
  return supabase.storage.from("perfiles").getPublicUrl(path).data.publicUrl;
}

const DIAS_SEMANA = [
  { weekday: 1, label: "Lunes" },
  { weekday: 2, label: "Martes" },
  { weekday: 3, label: "Miércoles" },
  { weekday: 4, label: "Jueves" },
  { weekday: 5, label: "Viernes" },
  { weekday: 6, label: "Sábado" },
  { weekday: 0, label: "Domingo" },
];

const HORARIO_DEFAULT = { opens_at: "09:00", closes_at: "20:00", is_closed: false };

export default function PerfilBarberia() {
  const [cargando, setCargando] = useState(true);
  const [sinBarberia, setSinBarberia] = useState(false);
  const [barberia, setBarberia] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [stats, setStats] = useState({ barberos: 0, rating: 0, totalOpiniones: 0 });
  const [activeTab, setActiveTab] = useState("Acerca");
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [horarios, setHorarios] = useState(() =>
    DIAS_SEMANA.map((d) => ({ weekday: d.weekday, ...HORARIO_DEFAULT }))
  );
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState("");
  const [nuevoServicioPrecio, setNuevoServicioPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [fotoPortada, setFotoPortada] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const fotoInputRef = useRef(null);
  const [opcionesCiudad, setOpcionesCiudad] = useState([]);
  const [opcionesZona, setOpcionesZona] = useState([]);

  useEffect(() => {
    let cancelado = false;
    ciudadesDe(barberia?.state).then((lista) => { if (!cancelado) setOpcionesCiudad(lista); });
    return () => { cancelado = true; };
  }, [barberia?.state]);

  useEffect(() => {
    let cancelado = false;
    zonasDe(barberia?.state, barberia?.city).then((lista) => { if (!cancelado) setOpcionesZona(lista); });
    return () => { cancelado = true; };
  }, [barberia?.state, barberia?.city]);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data: membership } = await supabase
        .from("barberia_memberships")
        .select("barberia_id")
        .eq("profile_id", uid)
        .eq("role", "owner")
        .eq("is_active", true)
        .maybeSingle();

      if (cancelado) return;

      if (!membership) {
        // El registro de barberías ahora lo hace exclusivamente el super admin
        // (adminController.crearBarberiaConDuenio); ya no existe un flujo de
        // autorregistro al que mandar a alguien sin barbería.
        setSinBarberia(true);
        setCargando(false);
        return;
      }

      const [{ data: b }, { data: serviciosData }, { data: hoursData }, { data: membershipsData }, { data: reviewsData }, { data: mediaData }] = await Promise.all([
        supabase.from("barberias").select("*").eq("id", membership.barberia_id).single(),
        supabase.from("services").select("id, name, price, duration_minutes, is_active").eq("barberia_id", membership.barberia_id).order("sort_order"),
        supabase.from("business_hours").select("weekday, opens_at, closes_at, is_closed").eq("barberia_id", membership.barberia_id),
        supabase.from("barberia_memberships").select("id").eq("barberia_id", membership.barberia_id).eq("role", "barber").eq("is_active", true),
        supabase.from("reviews").select("rating").eq("barberia_id", membership.barberia_id).eq("is_published", true),
        supabase.from("barberia_media").select("id, storage_path").eq("barberia_id", membership.barberia_id).eq("is_cover", true).maybeSingle(),
      ]);

      if (cancelado) return;

      setBarberia(b);
      setServicios(serviciosData ?? []);
      setFotoPortada(mediaData ?? null);

      if (hoursData?.length) {
        setHorarios(DIAS_SEMANA.map((d) => {
          const existente = hoursData.find((h) => h.weekday === d.weekday);
          return existente
            ? { weekday: d.weekday, opens_at: existente.opens_at.slice(0, 5), closes_at: existente.closes_at.slice(0, 5), is_closed: existente.is_closed }
            : { weekday: d.weekday, ...HORARIO_DEFAULT };
        }));
      }

      const calificaciones = reviewsData ?? [];
      setStats({
        barberos: membershipsData?.length ?? 0,
        rating: calificaciones.length ? calificaciones.reduce((acc, r) => acc + r.rating, 0) / calificaciones.length : 0,
        totalOpiniones: calificaciones.length,
      });

      setCargando(false);
    }

    cargar();
    return () => { cancelado = true; };
  }, []);

  const actualizarCampoBarberia = (campo, valor) => {
    setBarberia((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "state") { next.city = ""; next.zone = ""; }
      if (campo === "city") { next.zone = ""; }
      return next;
    });
  };

  const guardarCambios = async () => {
    setGuardando(true);
    setMensaje("");
    try {
      const { error: updateError } = await supabase
        .from("barberias")
        .update({
          name: barberia.name,
          description: barberia.description,
          phone: barberia.phone,
          address_line1: barberia.address_line1,
          state: barberia.state,
          city: barberia.city,
          zone: barberia.zone,
        })
        .eq("id", barberia.id);
      if (updateError) throw updateError;

      const { error: horariosError } = await supabase
        .from("business_hours")
        .upsert(
          horarios.map((h) => ({ barberia_id: barberia.id, ...h })),
          { onConflict: "barberia_id,weekday" }
        );
      if (horariosError) throw horariosError;

      setIsEditingHours(false);
      setMensaje("Cambios guardados correctamente.");
    } catch (err) {
      setMensaje(err.message || "No fue posible guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  };

  const subirFotoPortada = async (event) => {
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
      const path = `barberias/${barberia.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("perfiles").upload(path, file);
      if (uploadError) throw uploadError;

      if (fotoPortada) {
        const { error: removeError } = await supabase.storage.from("perfiles").remove([fotoPortada.storage_path]);
        if (removeError) throw removeError;
        const { error: deleteRowError } = await supabase.from("barberia_media").delete().eq("id", fotoPortada.id);
        if (deleteRowError) throw deleteRowError;
      }

      const { data: nuevaFoto, error: insertError } = await supabase
        .from("barberia_media")
        .insert({ barberia_id: barberia.id, storage_path: path, is_cover: true })
        .select("id, storage_path")
        .single();
      if (insertError) throw insertError;

      setFotoPortada(nuevaFoto);
    } catch (err) {
      setErrorFoto(err.message || "No fue posible subir la foto.");
    } finally {
      setSubiendoFoto(false);
      event.target.value = "";
    }
  };

  const eliminarFotoPortada = async () => {
    if (!fotoPortada) return;
    setSubiendoFoto(true);
    setErrorFoto("");
    try {
      await supabase.storage.from("perfiles").remove([fotoPortada.storage_path]);
      const { error: deleteError } = await supabase.from("barberia_media").delete().eq("id", fotoPortada.id);
      if (deleteError) throw deleteError;
      setFotoPortada(null);
    } catch (err) {
      setErrorFoto(err.message || "No fue posible eliminar la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  };

  const alternarPublicacion = async () => {
    const { error: pubError } = await supabase
      .from("barberias")
      .update({ is_published: !barberia.is_published })
      .eq("id", barberia.id);
    if (!pubError) {
      setBarberia((prev) => ({ ...prev, is_published: !prev.is_published }));
    }
  };

  const actualizarHorario = (weekday, campo, valor) => {
    setHorarios((prev) => prev.map((h) => (h.weekday === weekday ? { ...h, [campo]: valor } : h)));
  };

  const agregarServicio = async () => {
    if (!nuevoServicioNombre.trim() || !nuevoServicioPrecio.trim()) return;
    const { data, error } = await supabase
      .from("services")
      .insert({
        barberia_id: barberia.id,
        name: nuevoServicioNombre.trim(),
        price: Number(nuevoServicioPrecio),
        duration_minutes: 30,
      })
      .select("id, name, price, duration_minutes, is_active")
      .single();

    if (!error) {
      setServicios((prev) => [...prev, data]);
      setNuevoServicioNombre("");
      setNuevoServicioPrecio("");
    }
  };

  const eliminarServicio = async (id) => {
    await supabase.from("services").delete().eq("id", id);
    setServicios((prev) => prev.filter((s) => s.id !== id));
  };

  if (cargando) {
    return <div className="pagina-barberia-global"><p style={{ padding: 24 }}>Cargando tu barbería...</p></div>;
  }

  if (sinBarberia) {
    return (
      <div className="pagina-barberia-global">
        <p style={{ padding: 24 }}>
          Tu cuenta no tiene una barbería registrada. El alta de nuevas barberías la gestiona el equipo de Barber Hub — contacta a soporte.
        </p>
      </div>
    );
  }

  const iniciales = (barberia.name || "B").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="pagina-barberia-global">
      <div className="perfil-clean-wrapper">
        <div className="perfil-barber-cards-row-grid-three">

          {/* COLUMNA 1 */}
          <div className="layout-column">
            <div className="perfil-card-profile-black">
              <div style={{ position: "relative", width: 130, margin: "0 auto" }}>
                <div
                  style={{
                    width: 130, height: 130, borderRadius: "50%", background: "#374151",
                    border: "4px solid #D4AF37", overflow: "hidden", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  {fotoPortada ? (
                    <img
                      src={urlPublica(fotoPortada.storage_path)}
                      alt={barberia.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ fontSize: "1.4rem", fontWeight: 800 }}>{iniciales}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fotoInputRef.current?.click()}
                  disabled={subiendoFoto}
                  title="Cambiar foto"
                  style={{
                    position: "absolute", right: 0, bottom: 4, width: 32, height: 32, borderRadius: "50%",
                    background: "#111827", color: "#e5be6b", border: "3px solid #fff", display: "flex",
                    alignItems: "center", justifyContent: "center", cursor: subiendoFoto ? "wait" : "pointer",
                  }}
                >
                  <Camera size={15} />
                </button>
                {fotoPortada && (
                  <button
                    type="button"
                    onClick={eliminarFotoPortada}
                    disabled={subiendoFoto}
                    title="Eliminar foto"
                    style={{
                      position: "absolute", left: 0, bottom: 4, width: 32, height: 32, borderRadius: "50%",
                      background: "#fff", color: "#b90043", border: "3px solid #fff", display: "flex",
                      alignItems: "center", justifyContent: "center", cursor: subiendoFoto ? "wait" : "pointer",
                      boxShadow: "0 0 0 1px #e5e7eb",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <input ref={fotoInputRef} type="file" accept="image/*" onChange={subirFotoPortada} style={{ display: "none" }} />
              </div>
              {errorFoto && <p style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{errorFoto}</p>}

              <div className="perfil-editable-name-container">
                <input
                  type="text"
                  value={barberia.name ?? ""}
                  onChange={(e) => actualizarCampoBarberia("name", e.target.value)}
                  className="perfil-profile-title-name-input"
                  placeholder="Nombre de la barbería..."
                />
              </div>

              <p className="perfil-profile-subtitle-geo">
                <MapPin className="inline-geo-icon" /> {[barberia.zone, barberia.city].filter(Boolean).join(", ") || "Sin ubicación"}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn-primary-gold w-100"
                  onClick={alternarPublicacion}
                >
                  {barberia.is_published ? "Ocultar mi barbería" : "Publicar mi barbería"}
                </button>
                <a
                  href={`/barberia-perfil/${barberia.slug || barberia.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justify-content: "center",
                    gap: "8px",
                    textDecoration: "none",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #E9C46A",
                    color: "#E9C46A",
                    fontWeight: "600",
                    fontSize: "13px",
                    backgroundColor: "rgba(233, 196, 106, 0.08)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <ExternalLink size={16} />
                  Ver perfil de barbería
                </a>
              </div>
            </div>

            <div className="perfil-card-white-container localization-premium-card">
              <div className="localization-header-block">
                <div className="geo-icon-badge">
                  <MapPin className="w-5 h-5 icon-gold" />
                </div>
                <div className="localization-text-side">
                  <h3 className="card-section-title-modern">Localización</h3>
                  <input
                    type="text"
                    value={barberia.address_line1 ?? ""}
                    onChange={(e) => actualizarCampoBarberia("address_line1", e.target.value)}
                    className="geo-address-input-modern"
                    placeholder="Calle y número"
                  />
                </div>
              </div>

              <div className="add-service-fields-row" style={{ marginBottom: 12 }}>
                <select className="add-service-input-text" value={barberia.state ?? ""} onChange={(e) => actualizarCampoBarberia("state", e.target.value)}>
                  <option value="">Estado</option>
                  {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                </select>
                <select className="add-service-input-text" value={barberia.city ?? ""} onChange={(e) => actualizarCampoBarberia("city", e.target.value)} disabled={!barberia.state}>
                  <option value="">Ciudad</option>
                  {opcionesCiudad.map((ciudad) => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
                </select>
                <select className="add-service-input-text" value={barberia.zone ?? ""} onChange={(e) => actualizarCampoBarberia("zone", e.target.value)} disabled={!barberia.city}>
                  <option value="">Zona</option>
                  {opcionesZona.map((zona) => <option key={zona} value={zona}>{zona}</option>)}
                </select>
              </div>

              {barberia.location != null && (
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                  📍 Ubicación registrada. Los clientes podrán verla en el mapa una vez que publiques tu barbería.
                </p>
              )}
            </div>
          </div>

          {/* COLUMNA 2 */}
          <div className="perfil-card-white-container layout-column flex-between" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="perfil-custom-navigation-tabs">
                <button onClick={() => setActiveTab("Acerca")} className={`perfil-nav-tab-item ${activeTab === "Acerca" ? "active" : ""}`}><User className="w-3 h-3" /> Acerca</button>
                <button onClick={() => setActiveTab("Servicios")} className={`perfil-nav-tab-item ${activeTab === "Servicios" ? "active" : ""}`}><Scissors className="w-3 h-3" /> Servicios</button>
              </div>

              {activeTab === "Acerca" && (
                <>
                  <textarea
                    className="perfil-description-paragraph-text"
                    style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: 8, padding: 8 }}
                    rows={3}
                    value={barberia.description ?? ""}
                    onChange={(e) => actualizarCampoBarberia("description", e.target.value)}
                    placeholder="Describe tu barbería..."
                  />
                  <input
                    type="tel"
                    className="perfil-description-paragraph-text"
                    style={{ width: "100%", border: "1px solid var(--color-border)", borderRadius: 8, padding: 8, marginTop: 8 }}
                    value={barberia.phone ?? ""}
                    onChange={(e) => actualizarCampoBarberia("phone", e.target.value)}
                    placeholder="Teléfono de contacto"
                  />

                  <div className="mb-4 bg-black-50 p-3 rounded-xl border border-gray-100" style={{ marginTop: 12 }}>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="sub-section-title m-0">Horarios de atención</h4>
                      <button
                        onClick={() => (isEditingHours ? guardarCambios() : setIsEditingHours(true))}
                        disabled={guardando}
                        className={`modern-hours-toggle-btn ${isEditingHours ? "editing-active" : ""}`}
                      >
                        {isEditingHours ? <><Check className="w-3 h-3" /> {guardando ? "Guardando..." : "Listo"}</> : <><Edit2 className="w-3 h-3" /> Modificar</>}
                      </button>
                    </div>
                    <div className="working-hours-list-text">
                      {DIAS_SEMANA.map(({ weekday, label }) => {
                        const h = horarios.find((x) => x.weekday === weekday);
                        return (
                          <div className="hours-row mb-1" key={weekday}>
                            <span className="day-span-label">{label}</span>
                            {isEditingHours ? (
                              <div className="hours-edit-group">
                                <label style={{ fontSize: 11, display: "flex", gap: 4, alignItems: "center", cursor: "pointer", color: "#374151" }}>
                                  <input type="checkbox" checked={h.is_closed} onChange={(e) => actualizarHorario(weekday, "is_closed", e.target.checked)} />
                                  Cerrado
                                </label>
                                {!h.is_closed && (
                                  <div className="time-inputs-pair">
                                    <input type="time" value={h.opens_at} onChange={(e) => actualizarHorario(weekday, "opens_at", e.target.value)} className="inline-hours-editor-input" />
                                    <span style={{ fontSize: 11, color: "#6b7280" }}>a</span>
                                    <input type="time" value={h.closes_at} onChange={(e) => actualizarHorario(weekday, "closes_at", e.target.value)} className="inline-hours-editor-input" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="hours-val">{h.is_closed ? "Cerrado" : `${h.opens_at} - ${h.closes_at}`}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "Servicios" && (
                <div className="premium-services-panel">
                  <h4 className="perfil-sub-section-title-large">Gestión de Servicios</h4>

                  <div className="add-service-inline-card">
                    <h5>Añadir Servicio</h5>
                    <div className="add-service-fields-row">
                      <input type="text" placeholder="Nombre" value={nuevoServicioNombre} onChange={(e) => setNuevoServicioNombre(e.target.value)} className="add-service-input-text" />
                      <input type="number" placeholder="Precio" value={nuevoServicioPrecio} onChange={(e) => setNuevoServicioPrecio(e.target.value)} className="add-service-input-price" />
                      <button onClick={agregarServicio} className="add-service-submit-pill"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="services-cards-stack">
                    {servicios.map((s) => (
                      <div key={s.id} className="service-premium-row-card">
                        <div className="service-inputs-group-block">
                          <Scissors className="w-3.5 h-3.5 icon-gold" />
                          <span className="premium-service-name-input">{s.name}</span>
                          <span className="price-tag-prefix">$</span>
                          <span className="premium-service-price-input">{s.price}</span>
                        </div>
                        <button onClick={() => eliminarServicio(s.id)} className="delete-service-row-btn"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                    {servicios.length === 0 && <p style={{ fontSize: 12, color: "#6b7280" }}>Aún no tienes servicios.</p>}
                  </div>
                </div>
              )}
            </div>

            {mensaje && <p style={{ fontSize: 12, color: mensaje.includes("correctamente") ? "#15803d" : "#b91c1c" }}>{mensaje}</p>}
            <button className="btn-primary-gold mt-4" onClick={guardarCambios} disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

          {/* COLUMNA 3 */}
          <div className="perfil-card-white-container layout-column">
            <div className="horizontal-stats-header-bar">
              <div className="stat-segment"><span className="stat-top-lbl">Servicios</span><span className="stat-bottom-val">{servicios.length}</span></div>
              <div className="stat-segment border-x border-gray-100"><span className="stat-top-lbl"><Users className="w-3 h-3" style={{ display: "inline" }} /> Barberos</span><span className="stat-bottom-val">{stats.barberos}</span></div>
              <div className="stat-segment"><span className="stat-top-lbl">Calificación</span><span className="stat-bottom-val text-gold-rating"><Star size={12} style={{ display: "inline" }} /> {stats.rating.toFixed(1)} ({stats.totalOpiniones})</span></div>
            </div>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 8 }}>
              {barberia.is_published
                ? "Tu barbería es visible para los clientes en Explorar."
                : "Tu barbería aún no es visible para los clientes. Publícala cuando termines de configurarla."}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
