import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/favoritos.css";

// Mock de datos de barberías favoritas con IDs de ruta añadidos
const favoritosData = [
  {
    id: 1,
    barberiaId: "urban-cuts",
    nombre: "Barbería La Reforma",
    direccion: "Av. Sor Juana 142  0.8km",
    estado: "Abierto",
    calificacion: "4.7",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 2,
    barberiaId: "la-navaja-clasica",
    nombre: "Barbería La Navaja clásica",
    direccion: "Av. Sor Juana 142  0.8km",
    estado: "Abierto",
    calificacion: "4.8",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 3,
    barberiaId: "black-edge",
    nombre: "Carlos Reyes",
    direccion: "Barbería Black Edge",
    estado: "Cerrado",
    calificacion: "4.9",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  }
];

export default function Favoritos() {
  const navigate = useNavigate();
  const [menuActivo, setMenuActivo] = useState("Favoritos");
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(2);

  const manejarAgendar = (e, barberiaId) => {
    e.stopPropagation();
    navigate("/agenda-local", { state: { barberiaId: barberiaId } });
  };

  const manejarVerBarberia = (e, barberiaId) => {
    e.stopPropagation();
    navigate(`/barberia-perfil/${barberiaId}`);
  };

  return (
    <div className="fav-dashboard">
      <div className="fav-main-wrapper">

        <main className="fav-content-layout">
          <div className="fav-cards-container">
            {favoritosData.map((barberia) => (
              <div
                key={barberia.id}
                className={`fav-tarjeta ${tarjetaSeleccionada === barberia.id ? "seleccionada" : ""}`}
                onClick={() => setTarjetaSeleccionada(barberia.id)}
              >
                {/* Imagen miniatura */}
                <img src={barberia.imagen} alt={barberia.nombre} className="fav-imagen" />

                {/* Información central */}
                <div className="fav-info">
                  <h3>{barberia.nombre}</h3>
                  <p className="fav-direccion">{barberia.direccion}</p>
                  <div className="fav-estado">
                    <span className={`fav-punto-estado ${barberia.estado.toLowerCase()}`}></span>
                    <span className="fav-texto-estado">{barberia.estado}</span>
                  </div>
                </div>

                {/* Acciones a la derecha */}
                <div className="fav-acciones">
                  <span className="fav-calificacion">{barberia.calificacion}</span>
                  <div className="fav-grupo-botones">
                    <button
                      className="fav-boton dorado"
                      onClick={(e) => manejarAgendar(e, barberia.barberiaId)}
                    >
                      Agendar
                    </button>
                    <button
                      className="fav-boton gris"
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

      {/* menuActivo para evitar alertas/errores */}
      <span className="fav-oculto" onClick={() => setMenuActivo("Favoritos")}>
        {menuActivo}
      </span>
    </div>
  );
}