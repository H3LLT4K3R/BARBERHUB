import { useNavigate, useParams } from "react-router-dom";
import {
  IconMapPin,
  IconStarFilled,
  IconScissors,
  IconMoustache,
  IconRazor,
  IconUser,
  IconChevronLeft,
  IconCalendarEvent,
} from "@tabler/icons-react";
import AppNavbar from "../components/app-navbar";
import { getBarberiaById } from "../data/barberias.js";
import "../styles/mas-servicios.css";

/* Diccionario de iconos de servicio */
const ICONOS_SERVICIO = {
  moustache: IconMoustache,
  razor: IconRazor,
  user: IconUser,
  scissors: IconScissors,
};

/* Componente de estrellas */
function Estrellas({ count = 5 }) {
  return (
    <span className="estrellas" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <IconStarFilled key={i} size={16} />
      ))}
    </span>
  );
}

/* Componente principal: Más Servicios */
export default function MasServicios() {
  const navigate = useNavigate();
  const { id } = useParams();
  const barberia = getBarberiaById(id);

  // Manejo de caso de error si la barbería no existe
  if (!barberia) {
    return (
      <div className="pagina-servicios">
        <AppNavbar />
        <main className="contenido-servicios error-state">
          <h2>Barbería no encontrada</h2>
          <p>La barbería que estás buscando no existe o fue removida.</p>
          <button
            type="button"
            className="boton-regresar"
            onClick={() => navigate("/explorar")}
          >
            <IconChevronLeft size={18} />
            Volver a Explorar
          </button>
        </main>
      </div>
    );
  }

  // Servicios extendidos o normales
  const servicios = barberia.serviciosExtendidos ?? barberia.servicios ?? [];
  const mitad = Math.ceil(servicios.length / 2);
  const colA = servicios.slice(0, mitad);
  const colB = servicios.slice(mitad);

  return (
    <div className="pagina-servicios">
      {/* Navbar superior */}
      <AppNavbar />

      <main className="contenido-servicios">
        {/* Sección hero con datos de barbería */}
        <section className="hero-servicios">
          <div className="hero-izquierda">
            <img
              className="logo-barberia"
              src={barberia.imagen}
              alt={`Logotipo de ${barberia.nombre}`}
            />
            <div className="info-barberia-hero">
              <h1 className="titulo-barberia">{barberia.nombre}</h1>
              <div className="rating-barberia">
                <Estrellas />
                <span>
                  {barberia.rating?.toFixed(1) ?? "5.0"} ({barberia.totalOpiniones ?? 0} opiniones)
                </span>
              </div>
              <p className="direccion-barberia">
                <IconMapPin size={17} />
                {barberia.direccion}
              </p>
              <p className="estado-barberia">
                <span
                  className={`estado-dot ${barberia.abierto ? "estado-dot--abierto" : ""}`}
                />
                {barberia.abierto ? "Abierto ahora" : "Cerrado"}
              </p>
            </div>
          </div>
        </section>

        {/* Sección de servicios */}
        <section className="lista-servicios">
          <h2>Servicios disponibles</h2>

          {servicios.length === 0 ? (
            <p className="sin-servicios">No hay servicios disponibles registrados por el momento.</p>
          ) : (
            <div className="grid-servicios">
              {/* Columna A */}
              <ul className="columna-servicios">
                {colA.map((s) => {
                  const Icon = ICONOS_SERVICIO[s.icono] ?? IconScissors;
                  return (
                    <li key={s.id || s.nombre} className="item-servicio">
                      <span className="servicio-izquierda">
                        <Icon size={22} stroke={1.7} />
                        <span className="nombre-servicio">{s.nombre}</span>
                      </span>
                      <span className="precio-servicio">${Number(s.precio).toFixed(2)}</span>
                    </li>
                  );
                })}
              </ul>

              {/* Columna B */}
              <ul className="columna-servicios">
                {colB.map((s) => {
                  const Icon = ICONOS_SERVICIO[s.icono] ?? IconScissors;
                  return (
                    <li key={s.id || s.nombre} className="item-servicio">
                      <span className="servicio-izquierda">
                        <Icon size={22} stroke={1.7} />
                        <span className="nombre-servicio">{s.nombre}</span>
                      </span>
                      <span className="precio-servicio">${Number(s.precio).toFixed(2)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Botones de acción */}
          <div className="acciones-servicios">
            <button
              type="button"
              className="boton-regresar"
              onClick={() => navigate(`/barberia/${barberia.id}`)}
            >
              <IconChevronLeft size={18} />
              Regresar a la Barbería
            </button>

            <button
              type="button"
              className="boton-agendar"
              onClick={() => navigate(`/agendar/${barberia.id}`)}
            >
              <IconCalendarEvent size={18} />
              Agendar Cita
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}