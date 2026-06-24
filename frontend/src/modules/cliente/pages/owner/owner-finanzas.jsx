import { useState } from "react";
import "../../styles/owner/owner-finanzas.css";

const menuItems = [
  { label: "Finanzas", icon: "💰" },
  { label: "Gestión de Agenda", icon: "📅" },
  { label: "Inventario (Stock)", icon: "📦" },
  { label: "Ingresos", icon: "📈" },
];

const registrosIniciales = [
  {
    id: 1,
    servicio: "TaperFade",
    cliente: "Cliente: David G.",
    atendio: "Juan",
    metodoPago: "—",
    monto: 0,
  },
];

const egresosIniciales = [
  {
    id: 1,
    concepto: "Compra Insumos (Cera / Navajas)",
    responsable: "Responsable: Carlos (Admin)",
    monto: 0,
  },
];

export default function OwnerFinanzas() {
  const [seccionActiva, setSeccionActiva] = useState("Finanzas");
  const [registros] = useState(registrosIniciales);
  const [egresos, setEgresos] = useState(egresosIniciales);
  const [conceptoGasto, setConceptoGasto] = useState("");
  const [montoGasto, setMontoGasto] = useState("");

  const ingresosTotales = registros.reduce((acc, r) => acc + r.monto, 0);
  const egresosTotales = egresos.reduce((acc, e) => acc + e.monto, 0);
  const gananciaTotal = ingresosTotales - egresosTotales;

  const agregarEgreso = () => {
    if (!conceptoGasto.trim() || !montoGasto) return;
    setEgresos([
      ...egresos,
      {
        id: Date.now(),
        concepto: conceptoGasto,
        responsable: "Responsable: —",
        monto: Number(montoGasto),
      },
    ]);
    setConceptoGasto("");
    setMontoGasto("");
  };

  return (
    <div className="of-layout">
      {/* Header */}
      <header className="of-header">
        <img src="/logo.png" alt="Barber Hub" className="of-logo" />
      </header>

      <div className="of-body">
        {/* Sidebar */}
        <aside className="of-sidebar">
          <h2 className="of-sidebar-titulo">
            Panel <span className="of-owner-tag">Owner</span>
          </h2>

          <nav className="of-sidebar-menu">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className={`of-sidebar-item ${
                  seccionActiva === item.label ? "activo" : ""
                }`}
                onClick={() => setSeccionActiva(item.label)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="of-perfil">
            <div className="of-avatar">MG</div>
            <div className="of-perfil-info">
              <span className="of-perfil-nombre">Marcos Gonzales</span>
              <span className="of-perfil-rol">Owner</span>
            </div>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="of-main">
          <h1 className="of-titulo">CONSILADO DE FINANZAS</h1>
          <p className="of-subtitulo">
            Monitoreo de ingresos por captación, egresos y utilidad.
          </p>

          {/* Tarjetas resumen */}
          <div className="of-resumen">
            <div className="of-card-resumen">
              <span className="of-card-label">Ingresos Totales</span>
              <span className="of-card-monto">
                ${ingresosTotales.toLocaleString()}
              </span>
            </div>

            <div className="of-card-resumen">
              <span className="of-card-label">Egresos Totales</span>
              <span className="of-card-monto">
                ${egresosTotales.toLocaleString()}
              </span>
            </div>

            <div className="of-card-resumen of-card-oscura">
              <span className="of-card-label">Ganancia total</span>
              <span className="of-card-monto of-monto-dorado">
                ${gananciaTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Tablas */}
          <div className="of-tablas">
            {/* Registro de cobros */}
            <div className="of-panel-claro">
              <h3 className="of-panel-titulo">Registro de Cobros e Ingresos</h3>

              <table className="of-tabla">
                <thead>
                  <tr>
                    <th>Servicio / Cliente</th>
                    <th>Atendió / Captó</th>
                    <th>Método Pago</th>
                    <th className="of-col-monto">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className="of-celda-principal">{r.servicio}</span>
                        <span className="of-celda-secundaria">{r.cliente}</span>
                      </td>
                      <td className="of-celda-bold">{r.atendio}</td>
                      <td>{r.metodoPago}</td>
                      <td className="of-col-monto of-monto-positivo">
                        +${r.monto}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Control de egresos */}
            <div className="of-panel-oscuro">
              <h3 className="of-panel-titulo-dorado">Control de Egresos</h3>

              <div className="of-form-egreso">
                <input
                  type="text"
                  placeholder="Concepto de gasto"
                  className="of-input-concepto"
                  value={conceptoGasto}
                  onChange={(e) => setConceptoGasto(e.target.value)}
                />
                <div className="of-input-monto-wrapper">
                  <span className="of-simbolo-pesos">$</span>
                  <input
                    type="number"
                    className="of-input-monto"
                    value={montoGasto}
                    onChange={(e) => setMontoGasto(e.target.value)}
                  />
                </div>
                <button className="of-btn-agregar" onClick={agregarEgreso}>
                  +
                </button>
              </div>

              <div className="of-lista-egresos">
                {egresos.map((e) => (
                  <div key={e.id} className="of-egreso-item">
                    <div>
                      <span className="of-egreso-concepto">{e.concepto}</span>
                      <span className="of-egreso-responsable">
                        {e.responsable}
                      </span>
                    </div>
                    <span className="of-egreso-monto">-${e.monto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}