import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../../utils/api.js";
import { construirCeldasCalendario, fechaAKey, nombreMesAnio, DIAS_CORTOS } from "../../../utils/fecha.js";
import "../styles/agenda-local.css";

const hoySinHora = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function AgendaLocal() {
  const navigate = useNavigate();
  const location = useLocation();
  const volverA = location.state?.volverA ?? "/explorar";

  const {
    barberiaId,
    servicioIdReal,
    servicioNombre,
    precio,
    moneda,
    establecimiento,
  } = location.state ?? {};

  const regresar = () => {
    const volverAtras = location.state?.volverAtras;
    navigate(volverA, volverAtras ? { state: { volverA: volverAtras } } : undefined);
  };

  const hoy = hoySinHora();
  const [mesVisible, setMesVisible] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [slots, setSlots] = useState([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [error, setError] = useState("");

  const celdas = construirCeldasCalendario(mesVisible.getFullYear(), mesVisible.getMonth());

  const seleccionarDia = (fecha) => {
    setDiaSeleccionado(fecha);
    setHoraSeleccionada(null);
    setCargandoSlots(true);
    setError("");
  };

  useEffect(() => {
    if (!diaSeleccionado || !barberiaId) return;
    let cancelado = false;

    const params = new URLSearchParams({
      barberiaId,
      fecha: fechaAKey(diaSeleccionado),
    });

    apiFetch(`/citas/disponibilidad?${params.toString()}`)
      .then((data) => {
        if (cancelado) return;
        setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (cancelado) return;
        setError("No fue posible cargar los horarios disponibles.");
        setSlots([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoSlots(false);
      });

    return () => {
      cancelado = true;
    };
  }, [diaSeleccionado, barberiaId]);

  if (!barberiaId) {
    return (
      <div className="al-pagina">
        <main className="al-contenido">
          <p>Falta seleccionar una barbería. Vuelve a intentarlo desde su perfil.</p>
          <button className="al-boton-regresar" onClick={() => navigate("/explorar")}>Ir a explorar</button>
        </main>
      </div>
    );
  }

  const handleContinuar = () => {
    if (!diaSeleccionado || !horaSeleccionada) return;

    navigate("/datos-reserva", {
      state: {
        barberiaId,
        servicioIdReal,
        servicio: servicioNombre,
        precio,
        moneda,
        establecimiento,
        fecha: fechaAKey(diaSeleccionado),
        hora: horaSeleccionada,
      },
    });
  };

  return (
    <div className="al-pagina">
      <header className="al-encabezado">
        <div className="al-info-marca">
          <img src="/logo.png" alt="Logo" className="al-logo" />
          <div className="al-texto-marca">
            <h2>{establecimiento ?? "BARBER HUB"}</h2>
            <span>Barbería</span>
          </div>
        </div>
        <h1 className="al-titulo">Agenda tu próximo corte</h1>
      </header>

      <main className="al-contenido">
        <section className="al-seccion-calendario">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              disabled={mesVisible.getFullYear() === hoy.getFullYear() && mesVisible.getMonth() === hoy.getMonth()}
              style={{ border: "none", background: "transparent", fontSize: "1.3rem", cursor: "pointer" }}
            >
              ‹
            </button>
            <h3 className="al-titulo-mes" style={{ margin: 0, textTransform: "capitalize" }}>
              {nombreMesAnio(mesVisible)}
            </h3>
            <button
              type="button"
              onClick={() => setMesVisible((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              style={{ border: "none", background: "transparent", fontSize: "1.3rem", cursor: "pointer" }}
            >
              ›
            </button>
          </div>

          <div className="al-grid-calendario">
            {DIAS_CORTOS.map((d) => (
              <div key={d} className="al-dia-header">{d}</div>
            ))}

            {celdas.map(({ fecha, fueraDeMes }, index) => {
              const esPasado = fecha < hoy;
              const deshabilitado = fueraDeMes || esPasado;
              const esSeleccionado = diaSeleccionado && fechaAKey(fecha) === fechaAKey(diaSeleccionado);

              return (
                <div
                  key={index}
                  className={`al-celda-dia ${esSeleccionado ? "activo" : ""} ${deshabilitado ? "vacia" : ""}`}
                  onClick={() => !deshabilitado && seleccionarDia(fecha)}
                >
                  {fecha.getDate()}
                </div>
              );
            })}
          </div>
        </section>

        <section className="al-seccion-horarios">
          <h3 className="al-titulo-horarios">HORARIOS DISPONIBLES</h3>

          {!diaSeleccionado && <p>Elige un día en el calendario para ver los horarios.</p>}
          {cargandoSlots && <p>Cargando horarios...</p>}
          {error && <p className="al-error" style={{ color: "#b91c1c" }}>{error}</p>}
          {diaSeleccionado && !cargandoSlots && !error && slots.length === 0 && (
            <p>Este día no tiene horarios disponibles.</p>
          )}

          {diaSeleccionado && !cargandoSlots && slots.length > 0 && (
            <>
              <div className="al-grid-horarios">
                {slots.map((slot) => {
                  const esSeleccionado = horaSeleccionada === slot.hora;
                  let claseEstado = "disponible";
                  if (!slot.disponible) claseEstado = "ocupado";
                  else if (esSeleccionado) claseEstado = "seleccionado";

                  return (
                    <button
                      key={slot.hora}
                      className={`al-boton-hora ${claseEstado}`}
                      disabled={!slot.disponible}
                      onClick={() => setHoraSeleccionada(slot.hora)}
                    >
                      {slot.hora}
                    </button>
                  );
                })}
              </div>

              <div className="al-leyenda">
                <div className="al-leyenda-item"><span className="al-leyenda-punto seleccionado"></span><span>Seleccionado</span></div>
                <div className="al-leyenda-item"><span className="al-leyenda-punto disponible"></span><span>Disponible</span></div>
                <div className="al-leyenda-item"><span className="al-leyenda-punto ocupado"></span><span>Ocupado</span></div>
              </div>
            </>
          )}

          <div className="al-acciones-final">
            <button className="al-boton-regresar" onClick={regresar}>Regresar</button>
            <button className="al-boton-continuar" onClick={handleContinuar} disabled={!diaSeleccionado || !horaSeleccionada}>
              Continuar
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
