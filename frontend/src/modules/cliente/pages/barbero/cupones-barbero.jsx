import { useMemo, useState } from "react";
import { Check, ChevronDown, Plus, Search, Ticket, Trash2 } from "lucide-react";
import "../../styles/barbero/cupones-barbero.css";
import BarberoModal from "./barbero-modal";

const cuponesIniciales = [
  { id: 1, titulo: "10% Off", codigo: "HAIRWEDS", usos: 12, expira: "08/19/2026", activo: true },
  { id: 2, titulo: "25% Off", codigo: "VETERANS", usos: 301, expira: "01/20/2025", activo: false },
  { id: 3, titulo: "$15 Off", codigo: "HAIRWED", usos: 225, expira: "Renovar", activo: false },
  { id: 4, titulo: "$25 Off", codigo: "VETS", usos: 27, expira: "12/19/2026", activo: true },
];

export default function CuponesBarbero() {
  const [tipo, setTipo] = useState("general");
  const [aplicacion, setAplicacion] = useState("visita");
  const [primeraVisita, setPrimeraVisita] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [cupones, setCupones] = useState(cuponesIniciales);
  const [seleccionados, setSeleccionados] = useState([]);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [nuevoCupon, setNuevoCupon] = useState({ titulo: "", codigo: "", usos: "100", expira: "" });
  const [mensajeGuardado, setMensajeGuardado] = useState(false);

  const resultados = useMemo(() => cupones.filter((cupon) =>
    `${cupon.titulo} ${cupon.codigo}`.toLowerCase().includes(busqueda.toLowerCase()),
  ), [busqueda, cupones]);

  const alternarSeleccion = (id) => setSeleccionados((actual) =>
    actual.includes(id) ? actual.filter((item) => item !== id) : [...actual, id],
  );

  const eliminarSeleccionados = () => {
    if (!seleccionados.length) return;
    setCupones((actual) => actual.filter((cupon) => !seleccionados.includes(cupon.id)));
    setSeleccionados([]);
  };
  const crearCupon = (event) => {
    event.preventDefault();
    if (!nuevoCupon.titulo.trim() || !nuevoCupon.codigo.trim()) return;
    setCupones((actual) => [...actual, { id: Date.now(), titulo: nuevoCupon.titulo, codigo: nuevoCupon.codigo.toUpperCase(), usos: Number(nuevoCupon.usos) || 0, expira: nuevoCupon.expira || "Sin fecha", activo: true }]);
    setCrearAbierto(false); setNuevoCupon({ titulo: "", codigo: "", usos: "100", expira: "" }); setMensajeGuardado(true);
  };

  return (
    <section className="bc-page">
      <header className="bc-heading">
        <div><p className="bc-eyebrow">Panel barbero</p><h2>Crear cupones</h2><p>Diseña promociones para incentivar las reservas de tus clientes.</p></div>
        <button type="button" className="bc-new-top" onClick={() => setCrearAbierto(true)}><Plus size={17} /> Nuevo cupón</button>
      </header>

      <div className="bc-layout">
        <form className="bc-editor" onSubmit={(event) => event.preventDefault()}>
          <div className="bc-tabs" aria-label="Tipo de cupón">
            {[['general', 'General'], ['aplicado', 'Aplicado a'], ['uso', 'Por uso']].map(([valor, etiqueta]) => (
              <button type="button" className={tipo === valor ? "active" : ""} key={valor} onClick={() => setTipo(valor)}>{etiqueta}</button>
            ))}
          </div>

          <div className="bc-form-grid">
            <label>Por límite<input type="number" min="1" placeholder="Límite de usos" /></label>
            <fieldset><legend>Mínimo de compras en el servicio</legend>
              {[['servicios', 'Número mínimo de servicios'], ['visita', 'Mínimo por visita'], ['cantidad', 'Mínima cantidad']].map(([valor, etiqueta]) => <label className="bc-radio" key={valor}><input type="radio" name="aplicacion" checked={aplicacion === valor} onChange={() => setAplicacion(valor)} />{etiqueta}</label>)}
            </fieldset>
            <label>Por servicio<select defaultValue=""><option value="" disabled>Selecciona el servicio</option><option>Corte clásico</option><option>Corte + barba</option><option>Fade premium</option></select></label>
            <fieldset><legend>Máximo descuento por uso</legend>
              <label className="bc-radio"><input type="checkbox" />Número ilimitado de descuento por uso</label>
              <label className="bc-radio"><input type="checkbox" />Solamente un uso por cliente</label>
            </fieldset>
            <label>Mínimo de descuento<input type="number" min="0" placeholder="$0.00" /></label>
            <label className="bc-switch-row">Primera visita solamente <button type="button" className={primeraVisita ? "bc-switch active" : "bc-switch"} onClick={() => setPrimeraVisita(!primeraVisita)} aria-pressed={primeraVisita}><span /></button></label>
            <label className="bc-full">Descuento con servicio específico<select defaultValue=""><option value="" disabled>Selecciona servicio</option><option>Corte clásico</option><option>Barba premium</option></select></label>
          </div>
          <button className="bc-save" type="submit" onClick={() => setMensajeGuardado(true)}><Check size={17} /> Guardar configuración</button>
        </form>

        <aside className="bc-list-panel">
          <div className="bc-list-head"><div><p className="bc-eyebrow">Administración</p><h3>Cupones activos</h3></div><button type="button" className="bc-filter">Cupones <ChevronDown size={15} /></button></div>
          <label className="bc-search"><Search size={17} /><input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar cupón..." /></label>
          <div className="bc-list-actions"><button type="button" className="bc-delete" onClick={eliminarSeleccionados} disabled={!seleccionados.length}><Trash2 size={15} /> Eliminar</button><button type="button" className="bc-add" onClick={() => setCrearAbierto(true)}><Plus size={15} /> Añadir nuevo</button></div>
          <div className="bc-coupon-table" role="table"><div className="bc-table-header" role="row"><span /><span>Título / código</span><span>Usos</span><span>Expira</span></div>
            {resultados.map((cupon) => <div className="bc-coupon-row" role="row" key={cupon.id}><label><input type="checkbox" checked={seleccionados.includes(cupon.id)} onChange={() => alternarSeleccion(cupon.id)} /></label><div><strong>{cupon.titulo}</strong><small>{cupon.codigo}</small></div><span>{cupon.usos}</span><span className={cupon.activo ? "bc-expiry active" : "bc-expiry"}>{cupon.expira}</span></div>)}
            {!resultados.length && <p className="bc-empty"><Ticket size={20} /> No hay cupones que coincidan.</p>}
          </div>
        </aside>
      </div>
      <BarberoModal open={crearAbierto} title="Crear nuevo cupón" onClose={() => setCrearAbierto(false)} footer={<><button className="bm-secondary" onClick={() => setCrearAbierto(false)}>Cancelar</button><button className="bm-primary" form="bc-new-coupon-form" type="submit">Crear cupón</button></>}>
        <form id="bc-new-coupon-form" className="bc-modal-form" onSubmit={crearCupon}><label>Nombre de la promoción<input autoFocus value={nuevoCupon.titulo} onChange={(event) => setNuevoCupon({ ...nuevoCupon, titulo: event.target.value })} placeholder="Ej. 20% de descuento" /></label><label>Código<input value={nuevoCupon.codigo} onChange={(event) => setNuevoCupon({ ...nuevoCupon, codigo: event.target.value })} placeholder="EJ. BIENVENIDO20" /></label><label>Límite de usos<input type="number" min="1" value={nuevoCupon.usos} onChange={(event) => setNuevoCupon({ ...nuevoCupon, usos: event.target.value })} /></label><label>Fecha de expiración<input type="date" value={nuevoCupon.expira} onChange={(event) => setNuevoCupon({ ...nuevoCupon, expira: event.target.value })} /></label></form>
      </BarberoModal>
      <BarberoModal open={mensajeGuardado} title="Cambios guardados" onClose={() => setMensajeGuardado(false)} footer={<button className="bm-primary" onClick={() => setMensajeGuardado(false)}>Continuar</button>}><p>La información se actualizó temporalmente en esta sesión. Se guardará de forma permanente cuando conectemos el backend.</p></BarberoModal>
    </section>
  );
}
