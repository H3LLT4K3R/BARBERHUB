import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconArrowLeft } from "@tabler/icons-react";
import { supabase } from "../../../lib/supabase.js";
import { useActiveAccountGuard } from "../../../hooks/useActiveAccountGuard";
import "../styles/opinion-barberia.css";

function urlAvatar(path) {
  if (!path) return null;
  return supabase.storage.from("perfiles").getPublicUrl(path).data.publicUrl;
}

function iniciales(nombre) {
  return (nombre ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatearTiempo(fechaISO) {
  const fecha = new Date(fechaISO);
  const diffHoras = (Date.now() - fecha.getTime()) / 3600000;
  if (diffHoras < 1) return "Hace unos minutos";
  if (diffHoras < 24) {
    const horas = Math.floor(diffHoras);
    return `Hace ${horas} hora${horas === 1 ? "" : "s"}`;
  }
  const dias = Math.floor(diffHoras / 24);
  if (dias < 7) return `Hace ${dias} día${dias === 1 ? "" : "s"}`;
  return fecha.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
}

function Estrellas({ rating, size = "normal" }) {
  return (
    <span className={`obp-estrellas ${size}`} aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "obp-estrella llena" : "obp-estrella"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function OpinionBarberia() {
  useActiveAccountGuard();
  const navigate = useNavigate();
  const { state } = useLocation();
  const barberiaId = state?.barberiaId;

  const [barberia, setBarberia] = useState(null);
  const [opinionesBarberia, setOpinionesBarberia] = useState([]);
  const [opinionesBarberos, setOpinionesBarberos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [tabActiva, setTabActiva] = useState("barberia");
  const [filtroEstrellas, setFiltroEstrellas] = useState("todas");
  const [orden, setOrden] = useState("recientes");
  const [filtroBarbero, setFiltroBarbero] = useState("todos");

  useEffect(() => {
    if (!barberiaId) {
      setCargando(false);
      return;
    }
    let cancelado = false;

    (async () => {
      const [{ data: b }, { data: reviews }] = await Promise.all([
        supabase.from("barberias_public").select("*").eq("id", barberiaId).maybeSingle(),
        supabase
          .from("reviews")
          .select("id, rating, comment, created_at, client_id, barber_membership_id, barberia_memberships!barber_membership_id(display_name)")
          .eq("barberia_id", barberiaId)
          .eq("is_published", true)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelado) return;
      setBarberia(b ?? null);

      // profiles_public en vez de embeber profiles directo: un cliente no puede leer
      // el perfil completo de otra persona por RLS, solo la vista angosta nombre/foto.
      const idsAutores = [...new Set((reviews ?? []).map((r) => r.client_id).filter(Boolean))];
      const { data: autoresData } = idsAutores.length
        ? await supabase.from("profiles_public").select("id, full_name, avatar_path").in("id", idsAutores)
        : { data: [] };
      const autorPorId = new Map((autoresData ?? []).map((a) => [a.id, a]));
      const todas = (reviews ?? []).map((r) => ({ ...r, profiles: autorPorId.get(r.client_id) ?? null }));

      setOpinionesBarberia(todas);
      setOpinionesBarberos(todas.filter((r) => r.barber_membership_id));
      setCargando(false);
    })();

    return () => { cancelado = true; };
  }, [barberiaId]);

  const barberosConOpiniones = useMemo(() => {
    const mapa = new Map();
    opinionesBarberos.forEach((r) => {
      if (r.barber_membership_id && !mapa.has(r.barber_membership_id)) {
        mapa.set(r.barber_membership_id, r.barberia_memberships?.display_name ?? "Barbero");
      }
    });
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [opinionesBarberos]);

  const opinionesFiltradas = useMemo(() => {
    const listaBase = tabActiva === "barberia" ? opinionesBarberia : opinionesBarberos;

    return listaBase
      .filter((item) => {
        const coincideEstrellas = filtroEstrellas === "todas" || item.rating === filtroEstrellas;
        const coincideBarbero = tabActiva !== "barberos" || filtroBarbero === "todos" || item.barber_membership_id === filtroBarbero;
        return coincideEstrellas && coincideBarbero;
      })
      .sort((a, b) => {
        if (orden === "recientes") return new Date(b.created_at) - new Date(a.created_at);
        return b.rating - a.rating;
      });
  }, [tabActiva, filtroEstrellas, filtroBarbero, orden, opinionesBarberia, opinionesBarberos]);

  if (cargando) {
    return <div className="obp-page"><div className="obp-content"><p>Cargando opiniones...</p></div></div>;
  }

  if (!barberia) {
    return (
      <div className="obp-page">
        <div className="obp-main">
          <div className="obp-content">
            <p>No se encontró la barbería.</p>
            <button type="button" className="obp-btn-back" onClick={() => navigate("/explorar")}>
              <IconArrowLeft size={17} aria-hidden="true" /> Ir a explorar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="obp-page">
      <div className="obp-main">

        <header className="obp-header">
          <button className="obp-logo-btn" type="button" aria-label="Ir a explorar" onClick={() => navigate("/explorar")}>
            <img src="/logo.png" alt="Barber Hub" className="obp-logo-barberhub" />
          </button>
        </header>

        <div className="obp-content">

          <div className="obp-barberia-info">
            <div className="obp-datos-block">
              <h1 className="obp-barberia-name">{barberia.name}</h1>
              <div className="obp-rating-row">
                <Estrellas rating={Math.round(barberia.rating)} />
                <span className="obp-total-opiniones">({barberia.total_opiniones} opiniones)</span>
              </div>
              <div className="obp-barberia-address">
                <span className="obp-check-icon">✔</span>
                {barberia.address_line1}, {barberia.city}
              </div>
            </div>

            <div className="obp-tabs">
              <button
                type="button"
                className={`obp-tab ${tabActiva === "barberia" ? "activo" : ""}`}
                onClick={() => { setTabActiva("barberia"); setFiltroBarbero("todos"); }}
              >
                Comentarios Barbería
              </button>
              <button
                type="button"
                className={`obp-tab ${tabActiva === "barberos" ? "activo" : ""}`}
                onClick={() => setTabActiva("barberos")}
              >
                Comentarios Barberos
              </button>
            </div>
          </div>

          <div className="obp-filters">
            <div className="obp-filters-left">
              <span className="obp-filters-label">Filtrar por:</span>
              <button
                type="button"
                className={`obp-filter ${filtroEstrellas === "todas" ? "activo" : ""}`}
                onClick={() => setFiltroEstrellas("todas")}
              >
                Todas
              </button>

              {[5, 4, 3, 2, 1].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`obp-filter-stars ${filtroEstrellas === num ? "activo" : ""}`}
                  onClick={() => setFiltroEstrellas(num)}
                  aria-label={`Filtrar ${num} estrellas`}
                >
                  <Estrellas rating={num} size="small" />
                </button>
              ))}
            </div>

            {tabActiva === "barberos" && barberosConOpiniones.length > 0 && (
              <label className="obp-barber-filter">
                <span>Barbero:</span>
                <select value={filtroBarbero} onChange={(e) => setFiltroBarbero(e.target.value)}>
                  <option value="todos">Todos los barberos</option>
                  {barberosConOpiniones.map((barbero) => (
                    <option key={barbero.id} value={barbero.id}>{barbero.nombre}</option>
                  ))}
                </select>
              </label>
            )}

            <div className="obp-sort-container">
              <select
                className="obp-sort-select"
                value={orden}
                onChange={(e) => setOrden(e.target.value)}
              >
                <option value="recientes">Más recientes</option>
                <option value="valorados">Mejor valorados</option>
              </select>
            </div>
          </div>

          <div className="obp-list">
            {opinionesFiltradas.length > 0 ? (
              opinionesFiltradas.map((op) => {
                const nombre = op.profiles?.full_name ?? "Cliente";
                const avatarUrl = urlAvatar(op.profiles?.avatar_path);
                return (
                  <div key={op.id} className="obp-review-card">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={nombre} className="obp-avatar" />
                    ) : (
                      <div className="obp-avatar obp-avatar-placeholder">{iniciales(nombre)}</div>
                    )}
                    <div className="obp-review-body">
                      <div className="obp-review-header">
                        <span className="obp-client-name">{nombre}</span>
                        <Estrellas rating={op.rating} size="small" />
                        <span className="obp-review-time">{formatearTiempo(op.created_at)}</span>
                      </div>
                      {tabActiva === "barberos" && op.barberia_memberships?.display_name && (
                        <p className="obp-review-barbero">Con {op.barberia_memberships.display_name}</p>
                      )}
                      <p className="obp-review-text">{op.comment || "Sin comentario."}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="obp-empty-state">
                {filtroEstrellas !== "todas"
                  ? `No hay opiniones con ${filtroEstrellas} estrellas en esta sección.`
                  : tabActiva === "barberia"
                    ? "Esta barbería todavía no tiene opiniones."
                    : "Todavía no hay opiniones sobre barberos en particular."}
              </div>
            )}
          </div>

          <div className="obp-actions">
            <button
              type="button"
              className="obp-btn-back"
              onClick={() => navigate(`/barberia-perfil/${barberiaId}`)}
            >
              <IconArrowLeft size={17} aria-hidden="true" />
              Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
