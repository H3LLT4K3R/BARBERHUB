import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Sparkles } from "lucide-react";
import { apiFetch } from "../../../../utils/api.js";

function Estrellas({ rating }) {
  return (
    <span style={{ color: "#D4AF37", letterSpacing: 1 }}>
      {"★".repeat(rating)}
      <span style={{ color: "#e5e7eb" }}>{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function SuperAdminOpiniones() {
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState("peor-primero");
  const [filtroEstrellas, setFiltroEstrellas] = useState("todas");
  const [procesandoId, setProcesandoId] = useState(null);
  const [error, setError] = useState("");

  const cargar = async () => {
    setCargando(true);
    try {
      const { resenas: data } = await apiFetch("/admin/resenas");
      setResenas(data ?? []);
    } catch (err) {
      setError(err.message || "No fue posible cargar las reseñas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const resenasOrdenadas = useMemo(() => {
    const filtradas = filtroEstrellas === "todas" ? resenas : resenas.filter((r) => r.rating === filtroEstrellas);
    const copia = [...filtradas];
    copia.sort((a, b) => (orden === "peor-primero" ? a.rating - b.rating : b.rating - a.rating));
    return copia;
  }, [resenas, orden, filtroEstrellas]);

  const alternarDestacada = async (resena) => {
    setProcesandoId(resena.id);
    setError("");
    try {
      await apiFetch(`/resenas/${resena.id}/destacar`, {
        method: "POST",
        body: JSON.stringify({ destacar: !resena.is_featured }),
      });
      setResenas((prev) => prev.map((r) => (r.id === resena.id ? { ...r, is_featured: !resena.is_featured } : r)));
    } catch (err) {
      setError(err.message || "No fue posible actualizar la reseña.");
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="card-white-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <h3 className="sub-section-title-large" style={{ margin: 0 }}>Opiniones de toda la plataforma</h3>
        <button
          type="button"
          className="owner-usuarios-submit-btn"
          style={{ maxWidth: 180, marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          onClick={() => setOrden((prev) => (prev === "peor-primero" ? "mejor-primero" : "peor-primero"))}
        >
          <ArrowDownUp size={14} /> {orden === "peor-primero" ? "Peor primero" : "Mejor primero"}
        </button>
      </div>
      <p style={{ color: "#6b7280", fontSize: 14, marginTop: 0, marginBottom: 16 }}>
        Elige qué reseñas se muestran como testimonios en el landing page de Barber Hub.
      </p>

      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Filtrar por:</span>
        <div className="role-toggle-group" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`role-toggle-btn ${filtroEstrellas === "todas" ? "is-selected" : ""}`}
            onClick={() => setFiltroEstrellas("todas")}
          >
            Todas
          </button>
          {[5, 4, 3, 2, 1].map((num) => (
            <button
              key={num}
              type="button"
              className={`role-toggle-btn ${filtroEstrellas === num ? "is-selected" : ""}`}
              onClick={() => setFiltroEstrellas(num)}
              aria-label={`Filtrar ${num} estrellas`}
              title={`${num} estrellas`}
            >
              <Estrellas rating={num} />
            </button>
          ))}
        </div>
      </div>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <div className="accounts-list-stack">
        {cargando && <p style={{ textAlign: "center", color: "#6b7280", padding: 16 }}>Cargando...</p>}
        {!cargando && resenasOrdenadas.map((r) => (
          <div key={r.id} className="account-row-card" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
              <div className="account-info-col">
                <span className="account-name-text">{r.barberias?.name ?? "Barbería eliminada"}</span>
                <span className="account-email-text">{r.profiles?.full_name ?? "Cliente"} · <Estrellas rating={r.rating} /> ({r.rating}/5)</span>
                {r.barber_rating != null && (
                  <span className="account-email-text">
                    Barbero: {r.barberia_memberships?.display_name ?? "Sin nombre"} · <Estrellas rating={r.barber_rating} /> ({r.barber_rating}/5)
                  </span>
                )}
              </div>
              <div className="account-badges-group">
                {!r.is_published && <span className="status-badge is-inactive"><div className="status-dot"></div> Oculta</span>}
                {r.is_featured && <span className="status-badge is-active"><div className="status-dot"></div> En landing</span>}
              </div>
            </div>

            {r.comment && <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>{r.comment}</p>}
            {r.barber_comment && (
              <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>
                <strong>Sobre {r.barberia_memberships?.display_name ?? "el barbero"}:</strong> {r.barber_comment}
              </p>
            )}

            <div>
              <button
                type="button"
                className="owner-usuarios-submit-btn"
                style={{ maxWidth: 200, marginTop: 0, padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                onClick={() => alternarDestacada(r)}
                disabled={procesandoId === r.id || !r.is_published}
                title={!r.is_published ? "La reseña está oculta; el dueño debe publicarla primero" : undefined}
              >
                <Sparkles size={14} /> {r.is_featured ? "Quitar de landing" : "Destacar en landing"}
              </button>
            </div>
          </div>
        ))}
        {!cargando && resenasOrdenadas.length === 0 && (
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: 14, padding: 16 }}>
            {filtroEstrellas === "todas"
              ? "Todavía no hay reseñas en la plataforma."
              : `No hay reseñas con ${filtroEstrellas} estrellas.`}
          </p>
        )}
      </div>
    </div>
  );
}
