import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/agenda-local.css";

export default function AgendaLocal() {
  const navigate = useNavigate();

  // Estado para el día seleccionado (Mayo 2026)
  const [diaSeleccionado, setDiaSeleccionado] = useState(21);
  // Estado para la hora seleccionada (Inicia en "9:00" que es disponible)
  const [horaSeleccionada, setHoraSeleccionada] = useState("9:00");

  // Simulación de los días de Mayo 2026 (Empezando en Viernes 1)
  const diasMayo = [
    "", "", "", "", 1, 2, 3,
    4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17,
    18, 19, 20, 21, 22, 23, 24,
    25, 26, 27, 28, 29, 30, 31
  ];

  // Listado de horarios base con sus estados reales de ocupación
  const horariosBase = [
    { hora: "9:00", ocupado: false },
    { hora: "9:30", ocupado: true },
    { hora: "10:00", ocupado: true },
    { hora: "10:30", ocupado: true },
    { hora: "11:00", ocupado: false },
    { hora: "11:30", ocupado: false },
    { hora: "12:00", ocupado: true },
    { hora: "12:30", ocupado: false },
    { hora: "13:00", ocupado: false },
    { hora: "13:30", ocupado: false },
    { hora: "14:00", ocupado: false },
    { hora: "14:30", ocupado: true },
    { hora: "15:00", ocupado: false },
    { hora: "15:30", ocupado: true },
    { hora: "16:00", ocupado: true },
  ];

  const handleContinuar = () => {
    if (!diaSeleccionado || !horaSeleccionada) return;
    
    navigate("/datos-reserva", {
      state: {
        fecha: `2026-05-${diaSeleccionado.toString().padStart(2, "0")}`,
        hora: horaSeleccionada,
        barberiaId: "urban-cuts",
        establecimiento: "URBAN CUTS"
      }
    });
  };

  return (
    <div className="pagina-agenda">
      {/* Encabezado Superior */}
      <header className="encabezado-agenda">
        <div className="info-marca">
          <img src="/barberhublogo.jpg" alt="Logo" className="logo-barberia" />
          <div className="texto-marca">
            <h2>URBAN CUTS</h2>
            <span>Barbería</span>
          </div>
        </div>
        <h1 className="titulo-agenda">Agenda tu próximo corte</h1>
      </header>

      {/* Contenido Principal */}
      <main className="contenido-agenda">
        
        {/* Columna Izquierda: Calendario */}
        <section className="seccion-calendario">
          <h3 className="titulo-mes">MAYO 2026</h3>
          
          <div className="grid-calendario">
            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((d) => (
              <div key={d} className="encabezado-dia">{d}</div>
            ))}

            {diasMayo.map((dia, index) => {
              if (dia === "") return <div key={`empty-${index}`} className="celda-dia vacia"></div>;
              
              const esSeleccionado = diaSeleccionado === dia;
              return (
                <div
                  key={`dia-${dia}`}
                  className={`celda-dia ${esSeleccionado ? "activo" : ""}`}
                  onClick={() => setDiaSeleccionado(dia)}
                >
                  {dia}
                </div>
              );
            })}
          </div>

          </section>

          {/* Columna Derecha: Horarios Disponibles */}
          <section className="seccion-horarios">
          <h3 className="titulo-horarios">HORARIOS DISPONIBLES</h3>

          <div className="grid-horarios">
            {horariosBase.map((item) => {
              const esElSeleccionadoActual = horaSeleccionada === item.hora;
              
              // Definición dinámica de clases según tus reglas:
              let claseEstado = "disponible"; // Por defecto Verde
              if (item.ocupado) {
                claseEstado = "ocupado"; // Rojo estático
              } else if (esElSeleccionadoActual) {
                claseEstado = "seleccionado"; // El disponible activo se vuelve Gris
              }

              return (
                <button
                  key={item.hora}
                  className={`boton-hora ${claseEstado}`}
                  disabled={item.ocupado}
                  onClick={() => setHoraSeleccionada(item.hora)}
                >
                  {item.hora}
                </button>
              );
            })}
          </div>

          {/* Código de Colores / Leyenda */}
          <div className="caja-leyenda">
            <div className="item-leyenda">
              <span className="punto-leyenda seleccionado"></span>
              <span>Seleccionado</span>
            </div>
            <div className="item-leyenda">
              <span className="punto-leyenda disponible"></span>
              <span>Disponible</span>
            </div>
            <div className="item-leyenda">
              <span className="punto-leyenda ocupado"></span>
              <span>Ocupado</span>
            </div>
          </div>

          <button className="boton-continuar" onClick={handleContinuar}>
            Continuar
          </button>
        </section>

      </main>
    </div>
  );
}
