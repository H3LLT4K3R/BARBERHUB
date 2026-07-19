import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IconUser, IconUserCheck } from "@tabler/icons-react";
import { getBarberiaById } from "../data/barberias.js";
import "../styles/agenda-local.css";

export default function AgendaLocal() {
  const navigate = useNavigate();
  const location = useLocation();
  const volverA = location.state?.volverA ?? "/explorar";
  const barberia = getBarberiaById(location.state?.barberiaId ?? "urban-cuts");

  const regresar = () => {
    const volverAtras = location.state?.volverAtras;
    navigate(volverA, volverAtras ? { state: { volverA: volverAtras } } : undefined);
  };

  // Estado para el día seleccionado 
  const [diaSeleccionado, setDiaSeleccionado] = useState(21);
  // Estado para la hora seleccionada 
  const [horaSeleccionada, setHoraSeleccionada] = useState("9:00");
  const [servicioSeleccionado, setServicioSeleccionado] = useState(location.state?.servicioId ?? barberia.servicios[0]?.id ?? "");
  const [barberoSeleccionado, setBarberoSeleccionado] = useState(location.state?.barberoId ?? "");
  const servicio = barberia.servicios.find((item) => item.id === servicioSeleccionado) ?? barberia.servicios[0];
  const barbero = barberia.barberos.find((item) => item.id === barberoSeleccionado);

  // Simulación de los días de Mayo 2026 
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
    if (!diaSeleccionado || !horaSeleccionada || !servicio || !barberoSeleccionado) return;

    navigate("/datos-reserva", {
      state: {
        fecha: `2026-05-${diaSeleccionado.toString().padStart(2, "0")}`,
        hora: horaSeleccionada,
        barberiaId: barberia.id,
        establecimiento: barberia.nombre,
        servicio: servicio.nombre,
        precio: servicio.precio,
        moneda: barberia.moneda,
        barberoId: barbero?.id ?? null,
        barbero: barbero?.nombre ?? "Sin preferencia (por asignar)",
      }
    });
  };

  return (
    <div className="al-pagina">
      {/* Encabezado Superior */}
      <header className="al-encabezado">
        <div className="al-info-marca">
          <img src="/barberhublogo.jpg" alt="Logo" className="al-logo" />
          <div className="al-texto-marca">
            <h2>{barberia.nombre}</h2>
            <span>Barbería</span>
          </div>
        </div>
        <h1 className="al-titulo">Agenda tu próximo corte</h1>
      </header>

      {/* Contenido Principal */}
      <main className="al-contenido">
        <section className="al-seleccion-reserva" aria-label="Selecciona servicio y barbero">
          <div className="al-grupo-seleccion">
            <h3>1. Elige un servicio</h3>
            <div className="al-opciones-servicio">
              {barberia.servicios.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`al-opcion-servicio ${servicioSeleccionado === item.id ? "activo" : ""}`}
                  onClick={() => setServicioSeleccionado(item.id)}
                >
                  <span>{item.nombre}</span><strong>${item.precio}</strong>
                </button>
              ))}
            </div>
          </div>
          <div className="al-grupo-seleccion">
            <h3>2. Elige un barbero</h3>
            <div className="al-opciones-barbero">
              <button
                type="button"
                className={`al-opcion-barbero ${barberoSeleccionado === "sin-preferencia" ? "activo" : ""}`}
                onClick={() => setBarberoSeleccionado("sin-preferencia")}
              >
                <IconUserCheck size={20} />
                <span><strong>Sin preferencia</strong><small>Asignar el primer barbero disponible</small></span>
              </button>
              {barberia.barberos.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`al-opcion-barbero ${barberoSeleccionado === item.id ? "activo" : ""}`}
                  onClick={() => setBarberoSeleccionado(item.id)}
                >
                  <img src={item.foto} alt="" />
                  <span><strong>{item.nombre}</strong><small>★ {item.rating.toFixed(1)} · {item.opiniones} opiniones</small></span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Columna Izquierda: Calendario */}
        <section className="al-seccion-calendario">
          <h3 className="al-titulo-mes">MAYO 2026</h3>

          <div className="al-grid-calendario">
            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((d) => (
              <div key={d} className="al-dia-header">{d}</div>
            ))}

            {diasMayo.map((dia, index) => {
              if (dia === "") return <div key={`empty-${index}`} className="al-celda-dia vacia"></div>;

              const esSeleccionado = diaSeleccionado === dia;
              return (
                <div
                  key={`dia-${dia}`}
                  className={`al-celda-dia ${esSeleccionado ? "activo" : ""}`}
                  onClick={() => setDiaSeleccionado(dia)}
                >
                  {dia}
                </div>
              );
            })}
          </div>

        </section>

        {/* Columna Derecha: Horarios Disponibles */}
        <section className="al-seccion-horarios">
          <h3 className="al-titulo-horarios">HORARIOS DISPONIBLES</h3>
          {!barberoSeleccionado && <p className="al-aviso-seleccion"><IconUser size={18} /> Elige un barbero o “Sin preferencia” para continuar.</p>}

          <div className="al-grid-horarios">
            {horariosBase.map((item) => {
              const esElSeleccionadoActual = horaSeleccionada === item.hora;

             
              let claseEstado = "disponible"; // Por defecto Verde
              if (item.ocupado) {
                claseEstado = "ocupado"; // Rojo estático
              } else if (esElSeleccionadoActual) {
                claseEstado = "seleccionado"; // El disponible activo se vuelve Gris
              }

              return (
                <button
                  key={item.hora}
                  className={`al-boton-hora ${claseEstado}`}
                  disabled={item.ocupado}
                  onClick={() => setHoraSeleccionada(item.hora)}
                >
                  {item.hora}
                </button>
              );
            })}
          </div>

          {/* Código de Colores / Leyenda */}
          <div className="al-leyenda">
            <div className="al-leyenda-item">
              <span className="al-leyenda-punto seleccionado"></span>
              <span>Seleccionado</span>
            </div>
            <div className="al-leyenda-item">
              <span className="al-leyenda-punto disponible"></span>
              <span>Disponible</span>
            </div>
            <div className="al-leyenda-item">
              <span className="al-leyenda-punto ocupado"></span>
              <span>Ocupado</span>
            </div>
          </div>

          {/* Acciones finales: Regresar + Continuar */}
          <div className="al-acciones-final">
            <button className="al-boton-regresar" onClick={regresar}>
              Regresar
            </button>
            <button className="al-boton-continuar" onClick={handleContinuar}>
              Continuar
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}
