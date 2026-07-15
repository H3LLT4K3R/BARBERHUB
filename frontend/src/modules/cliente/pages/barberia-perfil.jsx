import React from "react"; 
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

/* --- DICCIONARIO DE ICONOS DE SERVICIO --- */
const ICONOS_SERVICIO = {
  moustache: IconMoustache,
  razor: IconRazor,
  user: IconUser,
  scissors: IconScissors,
};

/* --- COMPONENTE: ESTRELLAS --- */
function Estrellas({ count = 5 }) {
  return (
    <span className="bp-estrellas" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <IconStarFilled key={i} size={16} />
      ))}
    </span>
  );
}

/* --- COMPONENTE PRINCIPAL: PERFIL DE BARBERÍA --- */
export default function BarberiaPerfil() {
  const { id } = useParams();
  const navigate = useNavigate();
  const barberia = getBarberiaById(id);

  // 1. VALIDACIÓN DE SESIÓN (Mock usando localStorage)
  // Esto simula si el usuario ya inició sesión
  const usuarioAutenticado = localStorage.getItem("token_sesion");

  // 2. CONTROL DE ERRORES (Si no encuentra la barbería)
  if (!barberia) {
    return (
      <div className="bp-pagina">
        <AppNavbar />
        <main className="bp-contenido bp-contenido--error">
          <h2>Barbería no encontrada</h2>
          <button onClick={() => navigate("/")}>Volver al inicio</button>
        </main>
      </div>
    );
  }

  // --- ACCIONES DEL COMPONENTE ---

  // Abrir Google Maps
  const abrirMapa = () => {
    const url = `https://www.google.com/maps?q=${barberia.lat},${barberia.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Lógica de Agendar Cita (Protegida)
  const agendarCita = () => {
    if (usuarioAutenticado) {
      // Si ya hay sesión, lo enviamos directo a la ruta de agenda en tu App.jsx
      navigate("/agenda-local", { state: { barberiaId: barberia.id } });
    } else {
      // Si no hay sesión, le avisamos y lo mandamos al login 
      // con la ruta exacta de regreso para que no haya pantalla negra
      alert("Debes iniciar sesión en tu cuenta para agendar una cita.");
      navigate("/login", { state: { redirigirA: `/barberia-perfil/${barberia.id}` } });
    }
  };

  // Ver más servicios
  const verMasServicios = () => {
    // Esta ruta coincide con la que tienes en App.jsx: /barberia/:id/servicios
    navigate(`/barberia/${barberia.id}/servicios`);
  };

  // Ver más opiniones
  const verMasOpiniones = () => {
    // Esta ruta coincide con la que tienes en App.jsx: /opinion-barberia
    navigate("/opinion-barberia");
  };


  // --- RENDERIZADO DE LA INTERFAZ ---
  return (
    <div className="bp-pagina">
      <AppNavbar />

      <main className="bp-contenido">
        
        {/* SECCIÓN 1: Tarjeta principal (Hero) */}
        <section className="bp-hero" aria-label={`Perfil de ${barberia.nombre}`}>
          <div className="bp-hero-izquierda">
            <img className="bp-logo" src={barberia.imagen} alt="Logo de barbería" />
            
            <div className="bp-info">
              <h1 className="bp-titulo">{barberia.nombre}</h1>
              <div className="bp-rating">
                <Estrellas />
                <span>
                  {barberia.rating.toFixed(1)} ({barberia.totalOpiniones} opiniones)
                </span>
              </div>
              <p className="bp-direccion">
                <IconMapPin size={16} stroke={2} />
                {barberia.direccion}
              </p>
              <p className="bp-estado">
                <span
                  className={`bp-estado-dot ${barberia.abierto ? "abierto" : ""}`}
                  aria-hidden
                />
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

        {/* SECCIÓN 2: Grid de 3 columnas */}
        <div className="bp-grid">

          {/* Columna: Servicios */}
          <section className="bp-panel">
            <header className="bp-panel-encabezado">
              <IconScissors size={22} stroke={1.8} className="bp-icono-panel dorado" />
              <h2>Servicios</h2>
            </header>
            <ul className="bp-lista-servicios">
              {barberia.servicios.map((s) => {
                const Icon = ICONOS_SERVICIO[s.icono] ?? IconScissors;
                return (
                  <li key={s.id} className="bp-item-servicio">
                    <span className="bp-servicio-izquierda">
                      <Icon size={22} stroke={1.5} />
                      {s.nombre}
                    </span>
                    <span className="bp-precio-servicio">${s.precio}</span>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="bp-boton-ver-mas" onClick={verMasServicios}>
              Ver más servicios
            </button>
          </section>

          {/* Columna: Barberos */}
          <section className="bp-panel">
            <header className="bp-panel-encabezado">
              <IconUser size={22} stroke={1.8} className="bp-icono-panel" />
              <h2>Barberos</h2>
            </header>
            <ul className="bp-lista-barberos">
              {barberia.barberos.map((b) => (
                <li key={b.id} className="bp-item-barbero">
                  <img className="bp-foto-barbero" src={b.foto} alt={b.nombre} loading="lazy" />
                  <div>
                    <div className="bp-nombre-barbero">{b.nombre}</div>
                    <div className="bp-rating-barbero">
                      <IconStarFilled size={14} />
                      {b.rating.toFixed(1)}{" "}
                      <span className="bp-opiniones-barbero">({b.opiniones})</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Columna: Opiniones */}
          <section className="bp-panel">
            <header className="bp-panel-encabezado">
              <IconStarFilled size={24} className="bp-icono-panel dorado" />
              <h2>Opiniones</h2>
            </header>
            <ul className="bp-lista-opiniones">
              {barberia.opiniones.slice(0, 3).map((texto, i) => (
                <li key={i} className="bp-item-opinion">
                  <IconChevronRight size={16} className="bp-chevron-opinion" />
                  <p>{texto}</p>
                </li>
              ))}
            </ul>
            <button type="button" className="bp-boton-ver-mas" onClick={verMasOpiniones}>
              Ver más opiniones
            </button>
          </section>

        </div>
      </main>
    </div>
  );
}