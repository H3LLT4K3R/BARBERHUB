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
} from "@tabler/icons-react";
import AppNavbar from "../components/app-navbar";
import { supabase } from "../../../lib/supabase.js";
import { getOpenStreetMapUrl } from "../../../utils/openStreetMap.js";
import "../styles/barberia-perfil.css";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Estrellas({ count = 5 }) {
  return (
    <span className="bp-estrellas" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <IconStarFilled key={i} size={16} />
      ))}
    </span>
  );
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
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const volverA = location.state?.volverA ?? "/explorar";

  const [barberia, setBarberia] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [barberos, setBarberos] = useState([]);
  const [opiniones, setOpiniones] = useState([]);
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

      const [{ data: hours }, { data: servicesData }, { data: membershipsData }, { data: reviewsData }, favResult] = await Promise.all([
        supabase.from("business_hours").select("weekday, opens_at, closes_at, is_closed").eq("barberia_id", b.id),
        supabase.from("services").select("id, name, price, duration_minutes").eq("barberia_id", b.id).eq("is_active", true).order("sort_order").limit(4),
        supabase.from("barberia_memberships").select("id, display_name, specialty").eq("barberia_id", b.id).eq("role", "barber").eq("is_active", true),
        supabase.from("reviews").select("comment, rating").eq("barberia_id", b.id).eq("is_published", true).order("created_at", { ascending: false }).limit(3),
        uid ? supabase.from("favorite_barberias").select("barberia_id").eq("profile_id", uid).eq("barberia_id", b.id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      if (cancelado) return;

      setBarberia({ ...b, abierto: calcularAbierto(hours) });
      setServicios(servicesData ?? []);
      setBarberos(membershipsData ?? []);
      setOpiniones((reviewsData ?? []).map((r) => r.comment).filter(Boolean));
      setEsFavorita(Boolean(favResult?.data));
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
          servicioIdReal: servicios[0]?.id,
          servicioNombre: servicios[0]?.name,
          precio: servicios[0]?.price,
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
              {barberos.map((b) => (
                <li key={b.id} className="bp-item-barbero">
                  <div>
                    <div className="bp-nombre-barbero">{b.display_name ?? "Barbero"}</div>
                    {b.specialty && <div className="bp-opiniones-barbero">{b.specialty}</div>}
                  </div>
                </li>
              ))}
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
