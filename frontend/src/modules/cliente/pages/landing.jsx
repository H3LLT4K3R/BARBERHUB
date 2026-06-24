import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconSearch,
  IconMapPin,
  IconAdjustmentsHorizontal,
  IconLayoutDashboard,
  IconCash,
  IconStarFilled,
  IconScissors,
  IconCalendarCheck,
  IconUser,
  IconMoustache,
  IconBuildingStore,
  IconChartBar,
  IconUsers,
} from "@tabler/icons-react";
import BrandLogo from "../components/brand-logo";
import "../styles/landing.css";

// ─── DATOS ────────────────────────────────────────────────────────────────────
const CHIPS = ["Corte clásico", "Degradado / Fade", "Ritual de barba", "Perfilado"];

const EXP_CARDS = [
  {
    icons: [
      { component: IconScissors,      label: "Corte" },
      { component: IconUser,          label: "Cliente" },
      { component: IconMoustache,     label: "Barba" },
      { component: IconCalendarCheck, label: "Agenda" },
    ],
    title: "Para Clientes",
    desc: "Olvídate de las largas filas de espera. Encuentra profesionales disponibles en tu zona de inmediato.",
    feats: [
      { icon: <IconMapPin size={15} />,                   text: "Ubicación por mapa interactivo en tiempo real." },
      { icon: <IconAdjustmentsHorizontal size={15} />,    text: "Filtros por precio, valoración y servicios." },
    ],
  },
  {
    icons: [
      { component: IconBuildingStore, label: "Barbería" },
      { component: IconChartBar,      label: "Stats" },
      { component: IconCash,          label: "Ingresos" },
      { component: IconUsers,         label: "Clientes" },
    ],
    title: "Para Barberos y Dueños",
    desc: "Lleva tu negocio al entorno digital. Controla tus horarios, muestra tu ubicación y llena tu agenda.",
    feats: [
      { icon: <IconLayoutDashboard size={15} />, text: "Dashboard inteligente para gestionar turnos." },
      { icon: <IconCash size={15} />,            text: "Historial de ingresos y organización visual." },
    ],
  },
];

const TESTIMONIOS = [
  {
    initial: "C",
    color: "gold",
    name: "Carlos Mendoza",
    role: "Cliente Frecuente",
    quote: '"Buscaba una barbería abierta un lunes por la tarde. Con el mapa la encontré a 5 minutos y agendé de inmediato. El corte impecable."',
  },
  {
    initial: "M",
    color: "gray",
    name: "Marco Aurelio",
    role: "Dueño de Barbería",
    quote: '"Antes perdía mucho tiempo respondiendo mensajes. Ahora mis clientes entran aquí, ven horas libres y reservan solos."',
  },
];

// ─── STARS ────────────────────────────────────────────────────────────────────
function Stars({ count = 5 }) {
  return (
    <div className="lp-stars">
      {Array.from({ length: count }).map((_, i) => (
        <IconStarFilled key={i} size={18} color="#c9a227" />
      ))}
    </div>
  );
}

// ─── LANDING ──────────────────────────────────────────────────────────────────
export default function Landing() {
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const navigate = useNavigate();

  const solicitarUbicacion = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }

    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoStatus("granted");
      },
      () => {
        setGeoStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const buscarBarberias = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (coords) {
      params.set("lat", String(coords.lat));
      params.set("lng", String(coords.lng));
    }
    const qs = params.toString();
    navigate(qs ? `/explorar?${qs}` : "/explorar");
  };

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="lp-navbar">
        <BrandLogo className="lp-nav-logo" imgClassName="lp-nav-logo-img" />

        <div className="lp-nav-actions">
          <button className="lp-btn-outline" onClick={() => navigate("/agenda-local")}>
            Agenda en local
          </button>
          <button className="lp-btn-gold" onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-badge">Encuentra tu estilo en tu zona</div>

        <h1 className="lp-hero-title">
          Encuentra y agenda citas con<br />
          <span className="lp-accent">las mejores barberías</span>
        </h1>

        <p className="lp-hero-sub">
          Reserva servicios de corte y afeitado. Compara opiniones,
          Ve distancias reales y Agenda en segundos.
        </p>

        {/* Buscador */}
        <div className="lp-search-wrap">
          <IconSearch size={18} color="#aaaaaa" className="lp-search-icon" />
          <input
            className="lp-search-input"
            type="text"
            placeholder="¿Qué servicio buscas?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="lp-search-sep" />
          <button
            type="button"
            className="lp-search-loc"
            onClick={solicitarUbicacion}
            disabled={geoStatus === "loading"}
            title="Usar mi ubicación"
          >
            <IconMapPin size={15} color="#b87252" />
            {geoStatus === "loading"
              ? "Obteniendo ubicación..."
              : geoStatus === "granted"
                ? "Ubicación activada"
                : "Mi ubicación actual"}
          </button>
          <button
            className="lp-btn-search"
            onClick={buscarBarberias}
          >
            Buscar Barberías
          </button>
        </div>

        {/* Chips */}
        <div className="lp-chips-row">
          <span className="lp-chips-label">Búsquedas frecuentes</span>
          {CHIPS.map((c) => (
            <button key={c} className="lp-chip" onClick={() => setQuery(c)}>
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* ── DOS EXPERIENCIAS ── */}
      <section className="lp-two-exp">
        <div className="lp-sec-head">
          <h2>Una plataforma, dos experiencias</h2>
          <p>Diseñado tanto para quienes buscan un corte como para quienes lo crean.</p>
        </div>

        <div className="lp-exp-grid">
          {EXP_CARDS.map((card) => (
            <div className="lp-exp-card" key={card.title}>

              {/* Íconos con fondo crema */}
              <div className="lp-exp-icons">
                {card.icons.map((ico) => {
                  const Icon = ico.component;
                  return (
                    <div className="lp-exp-ico-wrap" key={ico.label}>
                      <Icon size={28} strokeWidth={1.5} color="#b87252" />
                    </div>
                  );
                })}
              </div>

              <h3>{card.title}</h3>
              <p>{card.desc}</p>

              <div className="lp-exp-feats">
                {card.feats.map((f, i) => (
                  <div className="lp-exp-feat" key={i}>
                    <span className="lp-feat-icon">{f.icon}</span>
                    {f.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="lp-testi">
        <div className="lp-testi-badge">Testimonios</div>
        <h2>Lo que dice nuestra comunidad</h2>

        <div className="lp-testi-grid">
          {TESTIMONIOS.map((t) => (
            <div className="lp-testi-card" key={t.name}>
              <Stars />
              <p className="lp-testi-quote">{t.quote}</p>
              <div className="lp-testi-author">
                <div className={`lp-testi-av lp-av-${t.color}`}>{t.initial}</div>
                <div>
                  <div className="lp-testi-name">{t.name}</div>
                  <div className="lp-testi-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        ©2026 BARBER HUB. Todos los derechos reservados.
      </footer>
    </>
  );
}