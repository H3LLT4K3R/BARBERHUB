import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/opinion-barberia.css";

const opinionesBarberia = [
  {
    id: 1,
    nombre: "Alexis Duran",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    tiempo: "Hace 1 hora",
    comentario: "Alexis siempre me deja el corte perfecto. ¡Muy recomendado el lugar!",
  },
  {
    id: 2,
    nombre: "Marco Pedraza",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 4,
    tiempo: "Hace 2 días",
    comentario: "Servicio excelente, siempre quedo muy satisfecho.",
  },
  {
    id: 3,
    nombre: "Yahir Hernandez",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    rating: 5,
    tiempo: "12 de mayo",
    comentario: "El lugar es genial y los barberos profesionales.",
  },
];

const opinionesBarberos = [
  { 
    id: 1, 
    nombre: "Carlos Reyes", 
    avatar: "https://randomuser.me/api/portraits/men/22.jpg", 
    rating: 5, 
    tiempo: "Hace 3 horas", 
    comentario: "Carlos es un barbero increíble, siempre atento a lo que quiero." 
  }, 
];

/* Opciones de orden disponibles para el menú desplegable */
const OPCIONES_ORDEN = [
  { valor: "recientes", etiqueta: "Más recientes" },
  { valor: "antiguos", etiqueta: "Más antiguos" },
  { valor: "mejor", etiqueta: "Mejor calificados" },
  { valor: "peor", etiqueta: "Peor calificados" },
];

function Estrellas({ rating, size = "normal" }) {
  return (
    <span className={`estrellas ${size}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "estrella llena" : "estrella"}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function OpinionBarberia() {
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState("barberia");
  const [filtroEstrellas, setFiltroEstrellas] = useState("todas");
  const [orden, setOrden] = useState("recientes");
  const [menuOrdenAbierto, setMenuOrdenAbierto] = useState(false);
  const menuOrdenRef = useRef(null);

  // Cierra el menú de orden si el usuario hace clic fuera de él
  useEffect(() => {
    function handleClickFuera(e) {
      if (menuOrdenRef.current && !menuOrdenRef.current.contains(e.target)) {
        setMenuOrdenAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const etiquetaOrdenActual =
    OPCIONES_ORDEN.find((op) => op.valor === orden)?.etiqueta ?? "Más recientes";

  const listaBase = tabActiva === "barberia" ? opinionesBarberia : opinionesBarberos;

  // 1. Filtra por estrellas seleccionadas
  const opinionesFiltradas =
    filtroEstrellas === "todas"
      ? listaBase
      : listaBase.filter((op) => op.rating === filtroEstrellas);

  // 2. Ordena según la opción activa (sin mutar el arreglo original)
  const opinionesOrdenadas = [...opinionesFiltradas].sort((a, b) => {
    if (orden === "antiguos") return listaBase.indexOf(b) - listaBase.indexOf(a);
    if (orden === "mejor") return b.rating - a.rating;
    if (orden === "peor") return a.rating - b.rating;
    // "recientes": mantiene el orden original del arreglo
    return listaBase.indexOf(a) - listaBase.indexOf(b);
  });

  return (
    <div className="pagina-opiniones">
      {/* SECCIÓN 1: CONTENEDOR PRINCIPAL DERECHO */}
      <div className="contenedor-principal">
        
        {/* Encabezado con logo */}
        <header className="encabezado">
          <button className="boton-logo" onClick={() => console.log("Logo clickeado")}>
            <img src="/logo.png" alt="Barber Hub" className="logo-barberhub" />
          </button>
        </header>

        {/* Contenido en flujo vertical */}
        <div className="contenido">
          
          {/* Nombre de la Barbería y Pestañas en la misma fila */}
          <div className="info-barberia">
            <div className="bloque-datos">
              <h1 className="nombre-barberia">Urban Cuts</h1>
              <div className="fila-rating">
                <Estrellas rating={5} />
                <span className="total-opiniones">(220 opiniones)</span>
              </div>
              <div className="direccion-barberia">
                <span className="icono-check">✔</span>
                Blvd. 10 de mayo, Puebla
              </div>
            </div>

            <div className="pestañas">
              <button
                className={`pestaña ${tabActiva === "barberia" ? "activo" : "inactivo"}`}
                onClick={() => {
                  setTabActiva("barberia");
                  setFiltroEstrellas("todas");
                }}
              >
                Comentarios Barbería
              </button>
              <button
                className={`pestaña ${tabActiva === "barberos" ? "activo" : "inactivo"}`}
                onClick={() => {
                  setTabActiva("barberos");
                  setFiltroEstrellas("todas");
                }}
              >
                Comentarios Barberos
              </button>
            </div>
          </div>

          {/* Filtros de opiniones */}
          <div className="filtros-opiniones">
            <div className="grupo-filtros-izq">
              <span className="etiqueta-filtros">Filtrar por:</span>
              <button
                className={`filtro ${filtroEstrellas === "todas" ? "activo" : ""}`}
                onClick={() => setFiltroEstrellas("todas")}
              >
                Todas
              </button>

              {[5, 4, 3, 2, 1].map((num) => (
                <button
                  key={num}
                  className={`filtro-estrellas ${filtroEstrellas === num ? "activo" : ""}`}
                  onClick={() => setFiltroEstrellas(num)}
                >
                  <Estrellas rating={num} size="small" />
                </button>
              ))}
            </div>

            {/* Botón de orden con menú desplegable */}
            <div className="contenedor-orden" ref={menuOrdenRef}>
              <button
                className="boton-ordenar"
                onClick={() => setMenuOrdenAbierto((prev) => !prev)}
              >
                {etiquetaOrdenActual}{" "}
                <span className={`icono-chevron ${menuOrdenAbierto ? "abierto" : ""}`}>
                </span>
              </button>

              {menuOrdenAbierto && (
                <ul className="menu-orden">
                  {OPCIONES_ORDEN.map((op) => (
                    <li key={op.valor}>
                      <button
                        className={`opcion-orden ${orden === op.valor ? "activo" : ""}`}
                        onClick={() => {
                          setOrden(op.valor);
                          setMenuOrdenAbierto(false);
                        }}
                      >
                        {op.etiqueta}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Lista de opiniones limpias */}
          <div className="lista-opiniones">
            {opinionesOrdenadas.map((op) => (
              <div key={op.id} className="tarjeta-opinion">
                <img src={op.avatar} alt={op.nombre} className="avatar-cliente" />
                <div className="cuerpo-opinion">
                  <div className="encabezado-opinion">
                    <span className="nombre-cliente">{op.nombre}</span>
                    <Estrellas rating={op.rating} size="small" />
                    <span className="tiempo-opinion">{op.tiempo}</span>
                  </div>
                  <p className="texto-opinion">{op.comentario}</p>
                </div>
              </div>
            ))}
            {opinionesOrdenadas.length === 0 && (
              <p style={{ padding: "24px 16px", color: "#718096" }}>
                No hay comentarios con esa calificación.
              </p>
            )}
          </div>

          {/* Botón regresar abajo a la derecha */}
          <div className="acciones">
            <button
              className="boton-regresar"
              onClick={() => navigate("/barberia-perfil/urban-cuts")}
            >
              Regresar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}