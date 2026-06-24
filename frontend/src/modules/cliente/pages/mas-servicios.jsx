import { useNavigate, useParams } from "react-router-dom";
import {
  IconMapPin,
  IconStarFilled,
  IconScissors,
  IconMoustache,
  IconRazor,
  IconUser,
  IconChevronLeft,
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
    <span className="estrellas" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <IconStarFilled key={i} size={16} />
      ))}
    </span>
  );
}

/* Componente principal: Más Servicios  */
export default function MasServicios() {
  const navigate = useNavigate();
  const { id } = useParams();
  const barberia = getBarberiaById(id);

  // Servicios extendidos o normales
  const servicios = barberia.serviciosExtendidos ?? barberia.servicios;
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
            <img className="logo-barberia" src={barberia.imagen} alt="" />
            <div>
              <h1 className="titulo-barberia">{barberia.nombre}</h1>
              <div className="rating-barberia">
                <Estrellas />
                <span>
                  {barberia.rating.toFixed(1)} ({barberia.totalOpiniones} opiniones)
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

          <div className="grid-servicios">
            {/* Columna A */}
            <ul className="columna-servicios">
              {colA.map((s) => {
                const Icon = ICONOS_SERVICIO[s.icono] ?? IconScissors;
                return (
                  <li key={s.id} className="item-servicio">
                    <span className="servicio-izquierda">
                      <Icon size={22} stroke={1.7} />
                      {s.nombre}
                    </span>
                    <span className="precio-servicio">${s.precio}</span>
                  </li>
                );
              })}
            </ul>

            {/* Columna B */}
            <ul className="columna-servicios">
              {colB.map((s) => {
                const Icon = ICONOS_SERVICIO[s.icono] ?? IconScissors;
                return (
                  <li key={s.id} className="item-servicio">
                    <span className="servicio-izquierda">
                      <Icon size={22} stroke={1.7} />
                      {s.nombre}
                    </span>
                    <span className="precio-servicio">${s.precio}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Botón regresar */}
          <div className="acciones-servicios">
            <button
              type="button"
              className="boton-regresar"
              onClick={() => navigate(`/barberia/${barberia.id}`)}
            >
              <IconChevronLeft size={18} />
              Regresar
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}