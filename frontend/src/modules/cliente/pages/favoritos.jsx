import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Importamos el hook de navegación
import "../styles/favoritos.css";

// Mock de datos de barberías favoritas con IDs de ruta añadidos
const favoritosData = [
  {
    id: 1,
    barberiaId: "urban-cuts", // ID para la URL
    nombre: "Barbería La Reforma",
    direccion: "Av. Sor Juana 142  0.8km",
    estado: "Abierto",
    calificacion: "4.7",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 2,
    barberiaId: "la-navaja-clasica", // ID para la URL
    nombre: "Barbería La Navaja clásica",
    direccion: "Av. Sor Juana 142  0.8km",
    estado: "Abierto",
    calificacion: "4.8",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 3,
    barberiaId: "black-edge", // ID para la URL
    nombre: "Carlos Reyes",
    direccion: "Barbería Black Edge",
    estado: "Cerrado",
    calificacion: "4.9",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  }
];

export default function Favoritos() {
  const navigate = useNavigate(); //Inicializamos el hook useNavigate
  const [menuActivo, setMenuActivo] = useState("Favoritos");
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(2);

  // Funciones para controlar la navegación al hacer clic
  const manejarAgendar = (e, barberiaId) => {
    e.stopPropagation(); // Evita que se seleccione la tarjeta al pulsar el botón
    navigate("/agenda-local", { state: { barberiaId: barberiaId } });
  };

  const manejarVerBarberia = (e, barberiaId) => {
    e.stopPropagation(); // Evita que se seleccione la tarjeta al pulsar el botón
    navigate(`/barberia-perfil//${barberiaId}`);
  };

  return (
    <div className="fav-dashboard">
      {/* Contenedor Principal (Entorno Blanco) */}
      <div className="fav-main-wrapper" style={{ paddingTop: "0px" }}>
        
        <main className="fav-content-layout">
          <div className="fav-cards-container">
            {favoritosData.map((barberia) => (
              <div
                key={barberia.id}
                className={`tarjeta-favorito ${tarjetaSeleccionada === barberia.id ? "seleccionada" : ""}`}
                onClick={() => setTarjetaSeleccionada(barberia.id)}
              >
                {/* Imagen miniatura */}
                <img src={barberia.imagen} alt={barberia.nombre} className="imagen-favorito" />

                {/* Información central */}
                <div className="info-favorito">
                  <h3>{barberia.nombre}</h3>
                  <p className="direccion-favorito">{barberia.direccion}</p>
                  <div className="estado-favorito">
                    <span className={`punto-estado ${barberia.estado.toLowerCase()}`}></span>
                    <span className="texto-estado">{barberia.estado}</span>
                  </div>
                </div>

                {/* Acciones a la derecha */}
                <div className="acciones-favorito">
                  <span className="calificacion-favorito">{barberia.calificacion}</span>
                  <div className="grupo-botones-favorito">
                    {/*  Evento onClick a los botones */}
                    <button 
                      className="btn-favorito btn-dorado"
                      onClick={(e) => manejarAgendar(e, barberia.barberiaId)}
                    >
                      Agendar
                    </button>
                    <button 
                      className="btn-favorito btn-gris"
                      onClick={(e) => manejarVerBarberia(e, barberia.barberiaId)}
                    >
                      Ver barbería
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/*  menuActivo para evitar alertas/errores */}
      <span style={{ display: "none" }} onClick={() => setMenuActivo("Favoritos")}>
        {menuActivo}
      </span>
    </div>
  );
}