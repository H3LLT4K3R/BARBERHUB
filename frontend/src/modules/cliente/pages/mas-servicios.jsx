import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IconMapPin,
  IconStarFilled,
  IconScissors,
  IconChevronLeft,
} from "@tabler/icons-react";
import AppNavbar from "../components/app-navbar";
import { supabase } from "../../../lib/supabase.js";
import { useActiveAccountGuard } from "../../../hooks/useActiveAccountGuard";
import "../styles/mas-servicios.css";

function Estrellas({ count = 5 }) {
  return (
    <span className="ms-estrellas" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <IconStarFilled key={i} size={16} />
      ))}
    </span>
  );
}

export default function MasServicios() {
  useActiveAccountGuard();
  const navigate = useNavigate();
  const { id } = useParams();
  const [barberia, setBarberia] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      const [{ data: b }, { data: s }] = await Promise.all([
        supabase.from("barberias_public").select("*").eq("id", id).maybeSingle(),
        supabase.from("services").select("id, name, price").eq("barberia_id", id).eq("is_active", true).order("sort_order"),
      ]);

      if (cancelado) return;
      setBarberia(b ?? null);
      setServicios(s ?? []);
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [id]);

  if (cargando) {
    return (
      <div className="ms-pagina">
        <AppNavbar />
        <main className="ms-contenido"><p>Cargando...</p></main>
      </div>
    );
  }

  if (!barberia) {
    return (
      <div className="ms-pagina">
        <AppNavbar />
        <main className="ms-contenido ms-contenido--error">
          <h2>Barbería no encontrada</h2>
          <button onClick={() => navigate("/explorar")}>Volver a explorar</button>
        </main>
      </div>
    );
  }

  const mitad = Math.ceil(servicios.length / 2);
  const colA = servicios.slice(0, mitad);
  const colB = servicios.slice(mitad);

  return (
    <div className="ms-pagina">
      <AppNavbar />

      <main className="ms-contenido">
        <section className="ms-hero">
          <div className="ms-hero-izquierda">
            <div>
              <h1 className="ms-titulo">{barberia.name}</h1>
              <div className="ms-rating">
                <Estrellas />
                <span>
                  {Number(barberia.rating).toFixed(1)} ({barberia.total_opiniones} opiniones)
                </span>
              </div>
              <p className="ms-direccion">
                <IconMapPin size={17} />
                {barberia.address_line1}, {barberia.city}
              </p>
            </div>
          </div>
        </section>

        <section className="ms-lista-servicios">
          <h2>Servicios disponibles</h2>

          <div className="ms-grid-servicios">
            <ul className="ms-columna-servicios">
              {colA.map((s) => (
                <li key={s.id} className="ms-item-servicio">
                  <span className="ms-servicio-izquierda">
                    <IconScissors size={22} stroke={1.7} />
                    {s.name}
                  </span>
                  <span className="ms-precio-servicio">${s.price}</span>
                </li>
              ))}
            </ul>

            <ul className="ms-columna-servicios">
              {colB.map((s) => (
                <li key={s.id} className="ms-item-servicio">
                  <span className="ms-servicio-izquierda">
                    <IconScissors size={22} stroke={1.7} />
                    {s.name}
                  </span>
                  <span className="ms-precio-servicio">${s.price}</span>
                </li>
              ))}
            </ul>
          </div>

          {servicios.length === 0 && <p>Aún no hay servicios publicados.</p>}

          <div className="ms-acciones">
            <button
              type="button"
              className="ms-boton-regresar"
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
