import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase.js";
import {
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
      { icon: <IconMapPin size={15} />,                   text: "Filtros por estado, ciudad y zona." },
      { icon: <IconAdjustmentsHorizontal size={15} />,    text: "Dependiendo de su localización, se muestran opciones relevantes." },
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
      { icon: <IconLayoutDashboard size={15} />, text: "Dashboard inteligente para gestionar tu negocio." },
      { icon: <IconCash size={15} />,            text: "Historial de ingresos y organización visual." },
    ],
  },
];

// estrellas
function Stars({ count = 5 }) {
  return (
    <div className="lp-stars">
      {Array.from({ length: count }).map((_, i) => (
        <IconStarFilled key={i} size={18} color="#c9a227" />
      ))}
    </div>
  );
}

// Landing
export default function Landing() {
  const [testimonios, setTestimonios] = useState([]);
  const [fotosCarrusel, setFotosCarrusel] = useState([]);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelado = false;

    supabase
      .from("reviews")
      .select("id, rating, comment, barberias(name)")
      .eq("is_featured", true)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (!cancelado) setTestimonios(data ?? []);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Imágenes de servicios curadas por el super admin (Panel > Galería), para la ruleta
  // del hero — no dependen de que ningún barbero suba nada.
  useEffect(() => {
    let cancelado = false;

    supabase
      .from("landing_gallery_images")
      .select("id, image_path, caption")
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (cancelado) return;
        setFotosCarrusel(
          (data ?? []).map((foto) => ({
            id: foto.id,
            name: foto.caption ?? "",
            url: supabase.storage.from("perfiles").getPublicUrl(foto.image_path).data.publicUrl,
          }))
        );
      });

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (fotosCarrusel.length < 2) return;
    const id = setInterval(() => {
      setIndiceActivo((i) => (i + 1) % fotosCarrusel.length);
    }, 4500);
    return () => clearInterval(id);
  }, [fotosCarrusel.length]);

  return (
    <>
      {/* Navbar */}
      <nav className="lp-navbar">
        <BrandLogo className="lp-nav-logo" imgClassName="lp-nav-logo-img" />

        <div className="lp-nav-actions">
          <button className="lp-btn-gold" onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero-badge">Encuentra tu estilo en tu zona</div>

        <h1 className="lp-hero-title">
          Encuentra y agenda citas con<br />
          <span className="lp-accent">las mejores barberías</span>
        </h1>

        <p className="lp-hero-sub">
          Reserva servicios de corte y afeitado. Compara opiniones,
          ve distancias reales y agenda en segundos.
        </p>

        {/* Ruleta de fotos de barberías reales de la plataforma */}
        {fotosCarrusel.length > 0 && (
          <div className="lp-carousel">
            <div className="lp-carousel-track">
              {fotosCarrusel.map((foto, i) => (
                <div key={foto.id} className={`lp-carousel-slide${i === indiceActivo ? " is-active" : ""}`}>
                  <img src={foto.url} alt={foto.name || "Servicio de barbería"} />
                  {foto.name && <span className="lp-carousel-caption">{foto.name}</span>}
                </div>
              ))}
            </div>
            {fotosCarrusel.length > 1 && (
              <div className="lp-carousel-dots">
                {fotosCarrusel.map((foto, i) => (
                  <button
                    key={foto.id}
                    type="button"
                    className={`lp-carousel-dot${i === indiceActivo ? " is-active" : ""}`}
                    onClick={() => setIndiceActivo(i)}
                    aria-label={`Ver imagen ${i + 1}${foto.name ? `: ${foto.name}` : ""}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* dos experiencias */}
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

              {card.ctaTexto && (
                <button
                  type="button"
                  className="lp-btn-search"
                  style={{ marginTop: 16 }}
                  onClick={async () => {
                    const { data } = await supabase.auth.getSession();
                    if (data.session) {
                      navigate(card.ctaRuta);
                    } else {
                      navigate("/login", { state: { redirigirA: card.ctaRuta } });
                    }
                  }}
                >
                  {card.ctaTexto}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Opiniones*/}
      {testimonios.length > 0 && (
        <section className="lp-testi">
          <div className="lp-testi-badge">Testimonios</div>
          <h2>Lo que dice nuestra comunidad</h2>

          <div className="lp-testi-grid">
            {testimonios.map((t) => (
              <div className="lp-testi-card" key={t.id}>
                <Stars count={t.rating} />
                <p className="lp-testi-quote">"{t.comment}"</p>
                <div className="lp-testi-author">
                  <div className="lp-testi-av lp-av-gold">
                    <IconStarFilled size={14} />
                  </div>
                  <div>
                    <div className="lp-testi-name">Cliente verificado</div>
                    <div className="lp-testi-role">{t.barberias?.name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="lp-footer">
        © 2026 URBAN CUTS. Todos los derechos reservados.
      </footer>
    </>
  );
}