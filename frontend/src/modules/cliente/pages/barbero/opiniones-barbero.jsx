import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Search, Star } from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { apiFetch } from "../../../../utils/api.js";
import "../../styles/barbero/opiniones-barbero.css";

export default function OpinionesBarbero() {
  const [opiniones, setOpiniones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  async function obtenerOpiniones() {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    const { data: membership } = await supabase
      .from("barberia_memberships")
      .select("barberia_id")
      .eq("profile_id", uid)
      .eq("is_active", true)
      .maybeSingle();

    if (!membership) return [];

    const { data } = await supabase
      .from("reviews")
      .select("id, rating, comment, is_published, is_featured, created_at, profiles!client_id(full_name)")
      .eq("barberia_id", membership.barberia_id)
      .order("created_at", { ascending: false });

    return data ?? [];
  }

  const cargar = async () => {
    setCargando(true);
    setOpiniones(await obtenerOpiniones());
    setCargando(false);
  };

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const data = await obtenerOpiniones();
      if (!cancelado) {
        setOpiniones(data);
        setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const resultados = useMemo(
    () => opiniones.filter((o) => `${o.profiles?.full_name ?? ""} ${o.comment ?? ""}`.toLowerCase().includes(busqueda.toLowerCase())),
    [opiniones, busqueda]
  );

  const promedio = opiniones.length
    ? (opiniones.reduce((acc, o) => acc + o.rating, 0) / opiniones.length).toFixed(1)
    : "0.0";

  const alternarPublicacion = async (opinion) => {
    setProcesando(true);
    setError("");
    try {
      await apiFetch(`/resenas/${opinion.id}/moderar`, {
        method: "POST",
        body: JSON.stringify({ publicar: !opinion.is_published }),
      });
      await cargar();
      setSeleccionada((prev) => (prev?.id === opinion.id ? { ...prev, is_published: !opinion.is_published } : prev));
    } catch (err) {
      setError(err.message || "No fue posible actualizar la reseña.");
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return <section className="bo-page"><p>Cargando opiniones...</p></section>;
  }

  return (
    <section className="bo-page">
      <header className="bo-heading">
        <div>
          <h2>Opiniones</h2>
          <span>Conoce la experiencia de tus clientes y gestiona sus reseñas.</span>
        </div>
      </header>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <div className="bo-layout">
        <aside className="bo-summary">
          <div className="bo-rating">
            <strong>{promedio}</strong>
            <div><span>{"★".repeat(Math.round(promedio))}</span><small>{opiniones.length} opiniones</small></div>
          </div>
          <label className="bo-search">
            <Search size={15} />
            <input placeholder="Buscar…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </label>
        </aside>

        <main className="bo-featured">
          {seleccionada ? (
            <>
              <article className="bo-featured-card">
                <div className="bo-stars">{"★".repeat(seleccionada.rating)}{"☆".repeat(5 - seleccionada.rating)}</div>
                <h3>{seleccionada.profiles?.full_name ?? "Cliente"}</h3>
                <div className="bo-featured-actions">
                  <button onClick={() => alternarPublicacion(seleccionada)} disabled={procesando}>
                    {seleccionada.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                    {seleccionada.is_published ? "Ocultar" : "Publicar"}
                  </button>
                  {seleccionada.is_featured && (
                    <span style={{ fontSize: 13, color: "#92660c", fontWeight: 600 }}>✨ Destacada en landing por Barber Hub</span>
                  )}
                </div>
              </article>
              <article className="bo-review-detail">
                <p>{seleccionada.comment || "Sin comentario."}</p>
              </article>
            </>
          ) : (
            <p className="bo-empty">Selecciona una reseña para ver el detalle.</p>
          )}
        </main>

        <section className="bo-list">
          <div className="bo-list-head">
            <h3>Reseñas recientes</h3>
            <span>{resultados.length} opiniones</span>
          </div>
          {resultados.map((opinion) => (
            <button
              className={seleccionada?.id === opinion.id ? "bo-review active" : "bo-review"}
              key={opinion.id}
              onClick={() => setSeleccionada(opinion)}
            >
              <strong>{opinion.profiles?.full_name ?? "Cliente"}</strong>
              <span>{opinion.comment || "Sin comentario"}</span>
              <small>
                <Star size={12} /> {opinion.rating}/5 {!opinion.is_published && "· Oculta"} {opinion.is_featured && "· ✨ En landing"}
              </small>
            </button>
          ))}
          {!resultados.length && <p className="bo-empty">No encontramos reseñas.</p>}
        </section>
      </div>
    </section>
  );
}
