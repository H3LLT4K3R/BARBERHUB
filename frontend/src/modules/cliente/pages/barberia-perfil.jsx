import { useNavigate, useParams } from "react-router-dom";
import {
  IconMapPin,
  IconCalendar,
  IconScissors,
  IconStarFilled,
  IconUser,
  IconMoustache,
  IconRazor,
  IconChevronRight,
} from "@tabler/icons-react";
import AppNavbar from "../components/app-navbar";
import { getBarberiaById } from "../data/barberias.js";
import "../styles/barberia-perfil.css";

/*  Diccionario de iconos de servicio*/
const ICONOS_SERVICIO = {
  moustache: IconMoustache,
  razor: IconRazor,
  user: IconUser,
  scissors: IconScissors,
};

/* Componente de estrellas */
function Estrellas({ count = 5 }) {
  return (
    <span className="estrellas-barberia" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <IconStarFilled key={i} size={16} />
      ))}
    </span>
  );
}

/* Componente principal: Perfil de Barbería*/
export default function BarberiaPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const barberia = getBarberiaById(id);

  // Acción: abrir ubicación en Google Maps
  const abrirMapa = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${barberia.lat},${barberia.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Acción: navegar a agenda de citas
  const agendarCita = () => {
    navigate("/agenda-local", { state: { barberiaId: barberia.id } });
  };

  // Acción: ver más servicios
  const verMasServicios = () => {
    navigate(`/barberia/${barberia.id}/servicios`);
  };

  return (
    <div className="pagina-barberia">
      <AppNavbar />

      <main className="contenido-barberia">
        {/* Tarjeta principal con datos de la barbería*/}
        <section className="hero-barberia" aria-label={`Perfil de ${barberia.nombre}`}>
          <div className="hero-izquierda">
            <img className="logo-barberia" src={barberia.imagen} alt="" />
            <div className="info-barberia">
              <h1 className="titulo-barberia">{barberia.nombre}</h1>
              <div className="rating-barberia">
                <Estrellas />
                <span>
                  {barberia.rating.toFixed(1)} ({barberia.totalOpiniones} opiniones)
                </span>
              </div>
              <p className="direccion-barberia">
                <IconMapPin size={16} stroke={2} />
                {barberia.direccion}
              </p>
              <p className="estado-barberia">
                <span
                  className={`estado-dot ${barberia.abierto ? "estado-dot--abierto" : ""}`}
                  aria-hidden
                />
                {barberia.abierto ? "Abierto ahora" : "Cerrado"}
              </p>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="acciones-hero">
            <button type="button" className="boton-mapa" onClick={abrirMapa}>
              <IconMapPin size={18} stroke={2} />
              Ver en el mapa
            </button>
            <button type="button" className="boton-agendar" onClick={agendarCita}>
              <IconCalendar size={18} stroke={2} />
              Agendar cita
            </button>
          </div>
        </section>

        {/*Tres columnas: Servicios, Barberos, Opiniones */}
        <div className="grid-barberia">
          
          {/* Panel de Servicios */}
          <section className="panel-barberia">
            <header className="panel-encabezado">
              <IconScissors size={22} stroke={1.8} className="icono-panel dorado" />
              <h2>Servicios</h2>
            </header>
            <ul className="lista-servicios">
              {barberia.servicios.map((s) => {
                const Icon = ICONOS_SERVICIO[s.icono] ?? IconScissors;
                return (
                  <li key={s.id} className="item-servicio">
                    <span className="servicio-izquierda">
                      <Icon size={22} stroke={1.5} />
                      {s.nombre}
                    </span>
                    <span className="precio-servicio">${s.precio}</span>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="boton-ver-mas" onClick={verMasServicios}>
              Ver más servicios
            </button>
          </section>

          {/* Panel de Barberos */}
          <section className="panel-barberia">
            <header className="panel-encabezado">
              <IconUser size={22} stroke={1.8} className="icono-panel" />
              <h2>Barberos</h2>
            </header>
            <ul className="lista-barberos">
              {barberia.barberos.map((b) => (
                <li key={b.id} className="item-barbero">
                  <img className="foto-barbero" src={b.foto} alt={b.nombre} loading="lazy" />
                  <div>
                    <div className="nombre-barbero">{b.nombre}</div>
                    <div className="rating-barbero">
                      <IconStarFilled size={14} />
                      {b.rating.toFixed(1)}{" "}
                      <span className="opiniones-barbero">({b.opiniones})</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Panel de Opiniones */}
          <section className="panel-barberia">
            <header className="panel-encabezado">
              <IconStarFilled size={24} className="icono-panel dorado" />
              <h2>Opiniones</h2>
            </header>
            <ul className="lista-opiniones">
              {barberia.opiniones.map((texto, i) => (
                <li key={i} className="item-opinion">
                  <IconChevronRight size={16} className="chevron-opinion" />
                  <p>{texto}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
