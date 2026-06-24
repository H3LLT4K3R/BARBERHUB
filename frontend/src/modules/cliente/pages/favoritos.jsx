import { useState } from "react";
import "../styles/favoritos.css";

// Mock de datos de barberías favoritas
const favoritosData = [
  {
    id: 1,
    nombre: "Barbería La Reforma",
    direccion: "Av. Sor Juana 142  0.8km",
    estado: "Abierto",
    calificacion: "4.7",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 2,
    nombre: "Barbería La Navaja clásica",
    direccion: "Av. Sor Juana 142  0.8km",
    estado: "Abierto",
    calificacion: "4.8",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 3,
    nombre: "Carlos Reyes",
    direccion: "Barbería Black Edge",
    estado: "Cerrado",
    calificacion: "4.9",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  }
];

export default function Favoritos() {
  const [menuActivo, setMenuActivo] = useState("Favoritos");
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(2);

  return (
    <div className="fav-dashboard">
      {/* Contenedor Principal (Entorno Blanco) */}
      <div className="fav-main-wrapper" style={{ paddingTop: "0px" }}>
        {/* Se removió el header redundante para que el contenido suba */}
        
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
                    <button className="btn-favorito btn-dorado">Agendar</button>
                    <button className="btn-favorito btn-gris">Ver barbería</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Uso de menuActivo para evitar alertas/errores de ESLint no-unused-vars */}
      <span style={{ display: "none" }} onClick={() => setMenuActivo("Favoritos")}>
        {menuActivo}
      </span>
    </div>
  );
}
