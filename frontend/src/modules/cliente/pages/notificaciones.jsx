import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase.js";
import "../styles/notificaciones.css";

const renderIcono = (tipo) => {
  switch (tipo) {
    case "appointment":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "review":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "payment":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case "promotion":
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
  }
};

function formatearFecha(fechaISO) {
  return new Date(fechaISO).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  async function obtenerNotificaciones() {
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, body, action_url, read_at, created_at")
      .order("created_at", { ascending: false });
    return data ?? [];
  }

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const data = await obtenerNotificaciones();
      if (!cancelado) {
        setNotificaciones(data);
        setCargando(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const handleNotificationClick = async (alerta) => {
    setNotificaciones((prev) => prev.map((n) => (n.id === alerta.id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)));
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", alerta.id).is("read_at", null);
    if (alerta.action_url) navigate(alerta.action_url);
  };

  const handleMarcarTodasLeidas = async () => {
    const ahora = new Date().toISOString();
    setNotificaciones((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? ahora })));
    await supabase.from("notifications").update({ read_at: ahora }).is("read_at", null);
  };

  const handleEliminar = async (e, id) => {
    e.stopPropagation();
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  };

  const sinLeerContador = notificaciones.filter((n) => !n.read_at).length;

  if (cargando) {
    return <div className="nt-dashboard"><p style={{ padding: 24 }}>Cargando notificaciones...</p></div>;
  }

  return (
    <div className="nt-dashboard">
      <div className="nt-main-wrapper">
        <main className="contenido">
          <div className="contenedor-cards">
            <div className="cabecera-notificaciones">
              <div className="contador-no-leidas">
                <span className="punto-indicador" />
                <p>{sinLeerContador} sin leer</p>
              </div>

              {sinLeerContador > 0 && (
                <button className="boton-limpiar" onClick={handleMarcarTodasLeidas}>
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="lista-notificaciones">
              {notificaciones.map((alerta) => (
                <div
                  key={alerta.id}
                  role="button"
                  tabIndex={0}
                  className={`tarjeta-notificacion ${!alerta.read_at ? "no-leida" : ""}`}
                  onClick={() => handleNotificationClick(alerta)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleNotificationClick(alerta)}
                  aria-label={`Notificación: ${alerta.title}`}
                >
                  <div className={`icono-contenedor ${alerta.type}`}>
                    {renderIcono(alerta.type)}
                  </div>

                  <div className="info-notificacion">
                    <h3>{alerta.title}</h3>
                    <p className="descripcion-notificacion">{alerta.body}</p>
                  </div>

                  <div className="meta-notificacion">
                    <span className="texto-tiempo">{formatearFecha(alerta.created_at)}</span>
                    {!alerta.read_at && <span className="punto-no-leida" />}
                    <button
                      type="button"
                      className="boton-eliminar-notificacion"
                      onClick={(e) => handleEliminar(e, alerta.id)}
                      aria-label="Eliminar notificación"
                      title="Eliminar notificación"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {notificaciones.length === 0 && <p style={{ padding: 16 }}>No tienes notificaciones.</p>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
