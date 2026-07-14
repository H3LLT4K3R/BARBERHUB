import { useState } from "react";
import "../styles/favoritos.css";

const FAVORITOS_DATOS = [
  {
    id: 1,
    nombre: "Barbería La Reforma",
    direccion: "Av. Sor Juana 142 • 0.8 km",
    estado: "Abierto",
    calificacion: "4.7",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 2,
    nombre: "Barbería La Navaja Clásica",
    direccion: "Av. Sor Juana 142 • 0.8 km",
    estado: "Abierto",
    calificacion: "4.8",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  },
  {
    id: 3,
    nombre: "Barbería Black Edge",
    direccion: "Calle Reyes 45 • 1.2 km",
    estado: "Cerrado",
    calificacion: "4.9",
    imagen: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop"
  }
];

export default function Favoritos() {
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(2);

  return (
    <div className="favoritos-contenedor">
      <main className="favoritos-layout">
        <div className="favoritos-lista-tarjetas">
          {FAVORITOS_DATOS.map((barberia) => {
            const estaAbierto = barberia.estado.toLowerCase() === "abierto";
            const esSeleccionada = tarjetaSeleccionada === barberia.id;

            return (
              <div
                key={barberia.id}
                className={`favoritos-tarjeta ${esSeleccionada ? "seleccionada" : ""}`}
                onClick={() => setTarjetaSeleccionada(barberia.id)}
              >
                {/* Imagen miniatura */}
                <img 
                  src={barberia.imagen} 
                  alt={barberia.nombre} 
                  className="favoritos-imagen" 
                />

                {/* Información central */}
                <div className="favoritos-info-principal">
                  <h3 className="favoritos-nombre">{barberia.nombre}</h3>
                  <p className="favoritos-direccion">{barberia.direccion}</p>
                  
                  <div className="favoritos-estado">
                    <span className={`favoritos-indicador-estado ${estaAbierto ? "abierto" : "cerrado"}`}></span>
                    <span className="favoritos-texto-estado">{barberia.estado}</span>
                  </div>
                </div>

                {/* Acciones e indicadores */}
                <div className="favoritos-acciones">
                  <span className="favoritos-calificacion">{barberia.calificacion} ★</span>
                  <div className="favoritos-grupo-botones">
                    <button className="favoritos-boton favoritos-boton-dorado">
                      Agendar
                    </button>
                    <button className="favoritos-boton favoritos-boton-gris">
                      Ver barbería
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}