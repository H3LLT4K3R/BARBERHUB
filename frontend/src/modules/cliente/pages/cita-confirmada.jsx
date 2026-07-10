import { useLocation, useNavigate } from "react-router-dom";
import { IconCircleCheck } from "@tabler/icons-react";
import { BARBERIA_DEMO } from "../data/barberia-demo.js";
import { formatearHorarioCorto, keyAFecha } from "../../../utils/fecha.js";
import PageNavbar from "../components/page-navbar";
import BrandLogo from "../components/brand-logo";
import "../styles/cita-confirmada.css";

/* Datos demo de cita */
const CITA_DEMO = {
  establecimiento: BARBERIA_DEMO.nombre,
  servicio: BARBERIA_DEMO.servicio,
  precio: BARBERIA_DEMO.precioEstimado,
  moneda: BARBERIA_DEMO.moneda,
  fecha: "2026-05-21",
  hora: "11:30",
};

/* Componente principal: Cita Confirmada*/
export default function CitaConfirmada() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Datos de la cita: se toman del state o del demo
  const cita = {
    establecimiento: state?.establecimiento ?? CITA_DEMO.establecimiento,
    servicio: state?.servicio ?? CITA_DEMO.servicio,
    precio: state?.precio ?? CITA_DEMO.precio,
    moneda: state?.moneda ?? CITA_DEMO.moneda,
    fecha: state?.fecha ?? CITA_DEMO.fecha,
    hora: state?.hora ?? CITA_DEMO.hora,
    nombre: state?.nombre ?? "",
    telefono: state?.telefono ?? "",
  };

  // Formateo de fecha y hora
  const fechaObj = keyAFecha(cita.fecha);
  const horarioCorto = formatearHorarioCorto(fechaObj, cita.hora);

  return (
    <div className="cc-page">
      <PageNavbar />
      <div className="cc-body">
        <div className="cc-card">

          {/* Icono de confirmación */}
          <div className="cc-icon" aria-hidden>
            <IconCircleCheck size={36} stroke={2} color="#fff" />
          </div>

          {/* Título principal */}
          <h1 className="cc-title">Cita confirmada</h1>

          {/* Mensaje de confirmación */}
          <p className="cc-message">
            Tu cita ha sido confirmada. Llega antes del{" "}
            <strong>{horarioCorto}</strong>. El servicio estará esperándote en{" "}
            <strong>{cita.establecimiento}</strong>.
          </p>

          {/* Resumen de la cita */}
          <div className="cc-summary">
            <div className="cc-summary-header">
              <span className="cc-summary-time">{horarioCorto}</span>
              <span className="cc-summary-price">
                ${cita.precio} {cita.moneda}
              </span>
            </div>

            <div className="cc-summary-detail">
              <BrandLogo
                className="cc-summary-logo-btn"
                imgClassName="cc-summary-logo"
              />
              <div>
                <div className="cc-service-name">{cita.servicio}</div>
                <div className="cc-barberia-name">
                  Barbería {cita.establecimiento}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="cc-actions">
            <button
              type="button"
              className="cc-btn-outline"
              onClick={() => navigate("/mis-citas", { state: { cita } })}
            >
              Ver mis citas
            </button>
            <button
              type="button"
              className="cc-btn-primary"
              onClick={() => navigate("/")}
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}