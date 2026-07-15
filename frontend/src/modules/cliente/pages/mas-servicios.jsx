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
    <span className="ms-estrellas" aria-hidden>
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

  // control de errores: Si la barbería no existe en la base de datos de prueba
  if (!barberia) {
    return (
      <div className="ms-pagina">
        <AppNavbar />
        <main className="ms-contenido ms-contenido--error">
          <h2>Barbería no encontrada</h2>
          <button onClick={() => navigate("/")}>Volver al inicio</button>
        </main>
      </div>
    );
  }

  // Servicios extendidos o normales
  const servicios = barberia.serviciosExtendidos ?? barberia.servicios;
  const mitad = Math.ceil(servicios.length / 2);
  const colA = servicios.slice(0, mitad);
  const colB = servicios.slice(mitad);

  return (
    <div className="ms-pagina">
      {/* Navbar superior */}
      <AppNavbar />

      <main className="ms-contenido">
        {/* Sección hero con datos de barbería */}
        <section className="ms-hero">
          <div className="ms-hero-izquierda">
            <img className="ms-logo" src={barberia.imagen} alt="" />
            <div>
              <h1 className="ms-titulo">{barberia.nombre}</h1>
              <div className="ms-rating">
                <Estrellas />
                <span>
                  {barberia.rating.toFixed(1)} ({barberia.totalOpiniones} opiniones)
                </span>
              </div>
              <p className="ms-direccion">
                <IconMapPin size={17} />
                {barberia.direccion}
              </p>
              <p className="ms-estado">
                <span
                  className={`ms-estado-dot ${barberia.abierto ? "abierto" : ""}`}
                />
                {barberia.abierto ? "Abierto ahora" : "Cerrado"}
              </p>
            </div>
          </div>
        </section>

        {/* Sección de servicios */}
        <section className="ms-lista-servicios">
          <h2>Servicios disponibles</h2>

          <div className="ms-grid-servicios">
            {/* Columna A */}
            <ul className="ms-columna-servicios">
              {colA.map((s) => {
                const Icon = ICONOS_SERVICIO[s.icono] ?? IconScissors;
                return (
                  <li key={s.id} className="ms-item-servicio">
                    <span className="ms-servicio-izquierda">
                      <Icon size={22} stroke={1.7} />
                      {s.nombre}
                    </span>
                    <span className="ms-precio-servicio">${s.precio}</span>
                  </li>
                );
              })}
            </ul>

            {/* Columna B */}
            <ul className="ms-columna-servicios">
              {colB.map((s) => {
                const Icon = ICONOS_SERVICIO[s.icono] ?? IconScissors;
                return (
                  <li key={s.id} className="ms-item-servicio">
                    <span className="ms-servicio-izquierda">
                      <Icon size={22} stroke={1.7} />
                      {s.nombre}
                    </span>
                    <span className="ms-precio-servicio">${s.precio}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Botón regresar */}
          <div className="ms-acciones">
            <button
              type="button"
              className="ms-boton-regresar"
              // CORRECCIÓN AQUÍ 👇
              onClick={() => navigate(`/barberia-perfil/${barberia.id}`)}
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