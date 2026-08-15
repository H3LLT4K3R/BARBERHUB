import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  IconMapPin,
  IconCalendar,
  IconScissors,
  IconStarFilled,
  IconUser,
  IconChevronRight,
  IconHeart,
  IconTicket,
} from "@tabler/icons-react";
import AppNavbar from "../components/app-navbar";
import { supabase } from "../../../lib/supabase.js";
import { getOpenStreetMapUrl } from "../../../utils/openStreetMap.js";
import { useActiveAccountGuard } from "../../../hooks/useActiveAccountGuard";
import "../styles/barberia-perfil.css";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function urlAvatarBarbero(path) {
  if (!path) return null;
  return supabase.storage.from("perfiles").getPublicUrl(path).data.publicUrl;
}

function Estrellas({ count = 5 }) {
  return (
    <span className="bp-estrellas" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <IconStarFilled key={i} size={16} />
      ))}
    </span>
  );
}

function formatDescuento(cupon) {
  return cupon.discount_type === "percent" ? `${cupon.discount_value}% OFF` : `$${cupon.discount_value} OFF`;
}

function formatFechaExpira(fechaIso) {
  return new Date(fechaIso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function calcularAbierto(businessHours) {
  if (!businessHours || businessHours.length === 0) return false;
  const ahora = new Date();
  const weekday = ahora.getDay();
  const hoy = businessHours.find((h) => h.weekday === weekday);
  if (!hoy || hoy.is_closed) return false;

  const [hIni, mIni] = hoy.opens_at.split(":").map(Number);
  const [hFin, mFin] = hoy.closes_at.split(":").map(Number);
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  return minutosAhora >= hIni * 60 + mIni && minutosAhora < hFin * 60 + mFin;
}

export default function BarberiaPerfil() {
  useActiveAccountGuard();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const volverA = location.state?.volverA ?? "/explorar";

  const [barberia, setBarberia] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [opiniones, setOpiniones] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioId, setUsuarioId] = useState(null);
  const [esFavorita, setEsFavorita] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const { data: userData } = await supabase.auth.getUser();
      if (cancelado) return;
      const uid = userData?.user?.id ?? null;
      setUsuarioId(uid);

      const filtro = UUID_REGEX.test(id) ? { column: "id", value: id } : { column: "slug", value: id };
      const { data: b } = await supabase
        .from("barberias_public")
        .select("*")
        .eq(filtro.column, filtro.value)
        .maybeSingle();

      if (!b) {
        setCargando(false);
        return;
      }

      const nowIso = new Date().toISOString();
      const [{ data: hours }, { data: servicesData }, { data: membershipsData }, { data: reviewsData }, favResult, { data: couponsData }] = await Promise.all([
        supabase.from("business_hours").select("weekday, opens_at, closes_at, is_closed").eq("barberia_id", b.id),
        supabase.from("services").select("id, name, price, duration_minutes").eq("barberia_id", b.id).eq("is_active", true).order("sort_order").limit(4),
        supabase.from("barberia_memberships").select("id, profile_id, display_name, specialty").eq("barberia_id", b.id).eq("role", "barber").eq("is_active", true),
        supabase.from("reviews").select("comment, rating").eq("barberia_id", b.id).eq("is_published", true).order("created_at", { ascending: false }).limit(3),
        uid ? supabase.from("favorite_barberias").select("barberia_id").eq("profile_id", uid).eq("barberia_id", b.id).maybeSingle() : Promise.resolve({ data: null }),
        // Solo cupones abiertos a cualquiera: los de "cliente frecuente" (minimum_visits)
        // se avisan directo al cliente por notificación cuando ya califica, no se listan aquí.
        supabase
          .from("coupons")
          .select("id, code, description, discount_type, discount_value, ends_at")
          .eq("barberia_id", b.id)
          .eq("is_active", true)
          .is("minimum_visits", null)
          .lte("starts_at", nowIso)
          .gte("ends_at", nowIso)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelado) return;

      // Las fotos de los barberos viven en profiles, pero un cliente no puede leer el
      // perfil de otra persona directo (RLS): se consulta la vista profiles_public,
      // que solo expone nombre/foto, no la fila completa.
      const idsBarberos = [...new Set((membershipsData ?? []).map((m) => m.profile_id).filter(Boolean))];
      const { data: avatarsData } = idsBarberos.length
        ? await supabase.from("profiles_public").select("id, avatar_path").in("id", idsBarberos)
        : { data: [] };
      const avatarPorId = new Map((avatarsData ?? []).map((p) => [p.id, p.avatar_path]));
      const barberosConAvatar = (membershipsData ?? []).map((m) => ({
        ...m,
        profiles: { avatar_path: avatarPorId.get(m.profile_id) ?? null },
      }));

      setBarberia({ ...b, abierto: calcularAbierto(hours) });
      setServicios(servicesData ?? []);
      setBarberos(barberosConAvatar);
      setOpiniones((reviewsData ?? []).map((r) => r.comment).filter(Boolean));
      setEsFavorita(Boolean(favResult?.data));
      setCupones(couponsData ?? []);
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (cargando) {
    return (
      <div className="bp-pagina">
        <AppNavbar />
        <main className="bp-contenido"><p>Cargando...</p></main>
      </div>
    );
  }

  if (!barberia) {
    return (
      <div className="bp-pagina">
        <AppNavbar />
        <main className="bp-contenido bp-contenido--error">
          <h2>Barbería no encontrada</h2>
          <button onClick={() => navigate("/explorar")}>Volver a explorar</button>
        </main>
      </div>
    );
  }


  // Abrir la ubicación en OpenStreetMap
  const abrirMapa = () => {
    const url = getOpenStreetMapUrl(barberia.lat, barberia.lng);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const agendarCita = () => {
    if (usuarioId) {
      navigate("/agenda-local", {
        state: {
          barberiaId: barberia.id,
          establecimiento: barberia.name,
          moneda: barberia.currency_code,
          volverA: `/barberia-perfil/${id}`,
          volverAtras: volverA,
        },
      });
    } else {
      alert("Debes iniciar sesión en tu cuenta para agendar una cita.");
      navigate("/login", { state: { redirigirA: `/barberia-perfil/${id}` } });
    }
  };

  const verMasServicios = () => {
    navigate(`/barberia/${barberia.id}/servicios`);
  };

  const verMasOpiniones = () => {
    navigate("/opinion-barberia", { state: { barberiaId: barberia.id } });
  };

  const regresar = () => navigate(volverA);

  const alternarFavorito = async () => {
    if (!usuarioId) {
      navigate("/login", { state: { redirigirA: `/barberia-perfil/${id}` } });
      return;
    }

    if (esFavorita) {
      await supabase.from("favorite_barberias").delete().eq("profile_id", usuarioId).eq("barberia_id", barberia.id);
      setEsFavorita(false);
    } else {
      await supabase.from("favorite_barberias").insert({ profile_id: usuarioId, barberia_id: barberia.id });
      setEsFavorita(true);
    }
  };

  return (
    <div className="bp-pagina">
      <AppNavbar />

      <main className="bp-contenido">
        <section className="bp-hero" aria-label={`Perfil de ${barberia.name}`}>
          <div className="bp-hero-izquierda">
            <div className="bp-info">
              <div className="bp-titulo-fila">
                <h1 className="bp-titulo">{barberia.name}</h1>
                <button
                  type="button"
                  className={`bp-boton-favorito ${esFavorita ? "activo" : ""}`}
                  onClick={alternarFavorito}
                  aria-label={esFavorita ? "Quitar de favoritos" : "Añadir a favoritos"}
                  title={esFavorita ? "Quitar de favoritos" : "Añadir a favoritos"}
                >
                  <IconHeart size={22} fill={esFavorita ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="bp-rating">
                <Estrellas />
                <span>
                  {Number(barberia.rating).toFixed(1)} ({barberia.total_opiniones} opiniones)
                </span>
              </div>
              <p className="bp-direccion">
                <IconMapPin size={16} stroke={2} />
                {barberia.address_line1}, {barberia.city}
              </p>
              <p className="bp-estado">
                <span className={`bp-estado-dot ${barberia.abierto ? "abierto" : ""}`} aria-hidden />
                {barberia.abierto ? "Abierto ahora" : "Cerrado"}
              </p>
            </div>
          </div>

          <div className="bp-acciones-hero">
            <button type="button" className="bp-boton-mapa" onClick={abrirMapa}>
              <IconMapPin size={18} stroke={2} />
              Ver en el mapa
            </button>
            <button type="button" className="bp-boton-agendar" onClick={agendarCita}>
              <IconCalendar size={18} stroke={2} />
              Agendar cita
            </button>
          </div>
        </section>

        {cupones.length > 0 && (
          <section className="bp-panel bp-panel-cupones">
            <header className="bp-panel-encabezado">
              <IconTicket size={22} stroke={1.8} className="bp-icono-panel dorado" />
              <h2>Cupones disponibles</h2>
            </header>
            <ul className="bp-lista-cupones">
              {cupones.map((c) => (
                <li key={c.id} className="bp-item-cupon">
                  <div className="bp-cupon-descuento">{formatDescuento(c)}</div>
                  <div className="bp-cupon-info">
                    <span className="bp-cupon-codigo">{c.code}</span>
                    {c.description && <span className="bp-cupon-descripcion">{c.description}</span>}
                  </div>
                  <span className="bp-cupon-expira">Válido hasta {formatFechaExpira(c.ends_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="bp-grid">
          <section className="bp-panel">
            <header className="bp-panel-encabezado">
              <IconScissors size={22} stroke={1.8} className="bp-icono-panel dorado" />
              <h2>Servicios</h2>
            </header>
            <ul className="bp-lista-servicios">
              {servicios.map((s) => (
                <li key={s.id} className="bp-item-servicio">
                  <span className="bp-servicio-izquierda">
                    <IconScissors size={22} stroke={1.5} />
                    {s.name}
                  </span>
                  <span className="bp-precio-servicio">${s.price}</span>
                </li>
              ))}
              {servicios.length === 0 && <li>Aún no hay servicios publicados.</li>}
            </ul>
            <button type="button" className="bp-boton-ver-mas" onClick={verMasServicios}>
              Ver más servicios
            </button>
          </section>

          <section className="bp-panel">
            <header className="bp-panel-encabezado">
              <IconUser size={22} stroke={1.8} className="bp-icono-panel" />
              <h2>Barberos</h2>
            </header>
            <ul className="bp-lista-barberos">
              {barberos.map((b) => {
                const avatarUrl = urlAvatarBarbero(b.profiles?.avatar_path);
                return (
                  <li key={b.id} className="bp-item-barbero">
                    <button
                      type="button"
                      className="bp-boton-barbero"
                      onClick={() => navigate(`/perfil-barbero/${b.id}`, { state: { volverA: `/barberia-perfil/${id}` } })}
                    >
                      {avatarUrl ? (
                        <img className="bp-foto-barbero" src={avatarUrl} alt={b.display_name ?? "Barbero"} />
                      ) : (
                        <span className="bp-foto-barbero bp-foto-barbero-placeholder"><IconUser size={20} /></span>
                      )}
                      <span>
                        <div className="bp-nombre-barbero">{b.display_name ?? "Barbero"}</div>
                        {b.specialty && <div className="bp-opiniones-barbero">{b.specialty}</div>}
                      </span>
                      <IconChevronRight size={16} className="bp-chevron-barbero" />
                    </button>
                  </li>
                );
              })}
              {barberos.length === 0 && <li>Sin barberos registrados.</li>}
            </ul>
          </section>

          <section className="bp-panel">
            <header className="bp-panel-encabezado">
              <IconStarFilled size={24} className="bp-icono-panel dorado" />
              <h2>Opiniones</h2>
            </header>
            <ul className="bp-lista-opiniones">
              {opiniones.map((texto, i) => (
                <li key={i} className="bp-item-opinion">
                  <IconChevronRight size={16} className="bp-chevron-opinion" />
                  <p>{texto}</p>
                </li>
              ))}
              {opiniones.length === 0 && <li>Aún no hay opiniones.</li>}
            </ul>
            <button type="button" className="bp-boton-ver-mas" onClick={verMasOpiniones}>
              Ver más opiniones
            </button>
          </section>
        </div>

        <div className="bp-accion-regresar">
          <button type="button" className="bp-boton-ver-mas" onClick={regresar}>
            Regresar
          </button>
        </div>
      </main>
    </div>
  );
}
