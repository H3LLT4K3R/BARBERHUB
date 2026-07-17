import { useMemo, useState } from "react";
import { Check, ChevronDown, Eye, MessageCircle, Search, Star, Trash2 } from "lucide-react";
import "../../styles/barbero/opiniones-barbero.css";
import BarberoModal from "./barbero-modal";

const opinionesIniciales = [
  { id: 1, nombre: "Mai B", servicio: "Corte y peinado", texto: "Me gustaría arreglar mi cabello usando productos de alta calidad.", fecha: "Sáb, 08:00 - 07:30 PM", rating: 4.8 },
  { id: 2, nombre: "Mina Za", servicio: "Corte y peinado", texto: "Me gustaría arreglar mi cabello usando productos de alta calidad.", fecha: "Sáb, 09:00 - 07:30 PM", rating: 4.8 },
  { id: 3, nombre: "Milad zaher", servicio: "Corte clásico", texto: "Excelente servicio y atención; volvería sin dudarlo.", fecha: "Dom, 11:00 - 12:00 PM", rating: 5.0 },
];
const promociones = ["HairCut", "Corte + barba", "Fade premium"];

export default function OpinionesBarbero() {
  const [opiniones, setOpiniones] = useState(opinionesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState(opinionesIniciales[0]);
  const [modal, setModal] = useState("");
  const [orden, setOrden] = useState("Rating");
  const resultados = useMemo(() => opiniones.filter((opinion) => `${opinion.nombre} ${opinion.texto}`.toLowerCase().includes(busqueda.toLowerCase())), [opiniones, busqueda]);
  const borrar = () => { setOpiniones([]); setSeleccionada(null); setModal(""); };
  return <section className="bo-page">
    <header className="bo-heading"><div><p>Panel barbero</p><h2>Opiniones</h2><span>Conoce la experiencia de tus clientes y gestiona sus reseñas.</span></div><button type="button" onClick={() => setModal("borrar")}><Trash2 size={16} /> Borrar comentarios</button></header>
    <div className="bo-layout">
      <aside className="bo-summary"><div className="bo-back"><strong>Mina Za</strong></div><img src="https://images.unsplash.com/photo-1532710093739-9470acff878f?auto=format&fit=crop&w=500&q=80" alt="Cliente" /><div className="bo-rating"><strong>4.7</strong><div><span>★★★★★</span><small>25.7 miles</small></div></div><div className="bo-bars">{[100, 0, 0, 0, 0].map((valor, index) => <div key={index}><span>{5 - index}</span><i><b style={{ width: `${valor}%` }} /></i><small>{valor}%</small></div>)}</div><p className="bo-views"><Eye size={13} /> 10K vistas</p><h4>Sobre el servicio:</h4><p>Me gustaría arreglar mi cabello usando productos de alta calidad.</p><div className="bo-filters"><button>Todos <ChevronDown size={13} /></button><button onClick={() => setOrden(orden === "Rating" ? "Recientes" : "Rating")}>{orden} <ChevronDown size={13} /></button></div><label className="bo-search"><Search size={15} /><input placeholder="Buscar…" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} /></label></aside>
      <main className="bo-featured">{seleccionada ? <><article className="bo-featured-card"><img src="https://images.unsplash.com/photo-1532710093739-9470acff878f?auto=format&fit=crop&w=500&q=80" alt={seleccionada.nombre} /><div className="bo-stars">★★★★☆</div><h3>{seleccionada.nombre}</h3><div className="bo-featured-actions"><button onClick={() => setModal("aceptar")}><Check size={14} /> Aceptar</button><button onClick={() => setModal("chat")}><MessageCircle size={14} /> Chat</button></div></article><article className="bo-review-detail"><h3>Hair by Alan C.</h3><p className="bo-stars">★★★★★ <span>4.0</span></p><p><strong>Buen cliente!</strong> Llegó a tiempo y listo para disfrutar de una experiencia de calidad.</p></article></> : <p className="bo-empty">No hay opiniones disponibles.</p>}</main>
      <section className="bo-list"><div className="bo-list-head"><h3>Reseñas recientes</h3><span>{resultados.length} opiniones</span></div>{resultados.map((opinion) => <button className={seleccionada?.id === opinion.id ? "bo-review active" : "bo-review"} key={opinion.id} onClick={() => setSeleccionada(opinion)}><strong>{opinion.nombre} · {opinion.servicio}</strong><span>{opinion.texto}</span><small>◷ {opinion.fecha} <b>☆ {opinion.rating} (3.2 mi)</b></small></button>)}{!resultados.length && <p className="bo-empty">No encontramos reseñas.</p>}</section>
    </div>
    <section className="bo-promotions"><div><p>Catálogo</p><h3>Opiniones del servicio</h3></div><div className="bo-promo-grid">{promociones.map((promo) => <article key={promo}><div><Star size={26} /></div><h4>{promo}</h4><span>★★★★★ 4.8 · 1,250 vistas</span><button onClick={() => setModal("promo")}>Ver detalle</button></article>)}</div></section>
    <BarberoModal open={modal === "aceptar"} title="Aceptar opinión" onClose={() => setModal("")} footer={<button className="bm-primary" onClick={() => setModal("")}>Confirmar</button>}><p>La opinión de {seleccionada?.nombre} quedará marcada como revisada.</p></BarberoModal>
    <BarberoModal open={modal === "chat"} title={`Chat con ${seleccionada?.nombre || "cliente"}`} onClose={() => setModal("")} footer={<button className="bm-primary" onClick={() => setModal("")}>Enviar</button>}><textarea className="bo-message" placeholder="Escribe un mensaje…" /></BarberoModal>
    <BarberoModal open={modal === "borrar"} title="Borrar comentarios" onClose={() => setModal("")} footer={<><button className="bm-secondary" onClick={() => setModal("")}>Cancelar</button><button className="bm-primary" onClick={borrar}>Sí, borrar</button></>}><p>Se ocultarán todas las opiniones de forma temporal durante esta sesión.</p></BarberoModal>
    <BarberoModal open={modal === "promo"} title="Detalle de servicio" onClose={() => setModal("")} footer={<button className="bm-primary" onClick={() => setModal("")}>Cerrar</button>}><p>Consulta el rendimiento y las opiniones asociadas a este servicio.</p></BarberoModal>
  </section>;
}
