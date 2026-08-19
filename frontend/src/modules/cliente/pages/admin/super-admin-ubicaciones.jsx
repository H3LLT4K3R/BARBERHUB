import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "../../../../utils/api.js";
import { supabase } from "../../../../lib/supabase.js";
import { ESTADOS, invalidarCacheUbicaciones } from "../../data/ubicaciones.js";

export default function SuperAdminUbicaciones() {
  const [estado, setEstado] = useState(ESTADOS[0]);
  const [ciudades, setCiudades] = useState([]);
  const [cargandoCiudades, setCargandoCiudades] = useState(true);
  const [nuevaCiudad, setNuevaCiudad] = useState("");
  const [creandoCiudad, setCreandoCiudad] = useState(false);
  const [borrandoCiudadId, setBorrandoCiudadId] = useState(null);

  const [ciudadSeleccionada, setCiudadSeleccionada] = useState(null);
  const [zonas, setZonas] = useState([]);
  const [cargandoZonas, setCargandoZonas] = useState(false);
  const [nuevaZona, setNuevaZona] = useState("");
  const [creandoZona, setCreandoZona] = useState(false);
  const [borrandoZonaId, setBorrandoZonaId] = useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarCiudades = async (estadoActual) => {
    setCargandoCiudades(true);
    const { data } = await supabase.from("ciudades").select("id, ciudad").eq("estado", estadoActual).order("ciudad");
    setCiudades(data ?? []);
    setCargandoCiudades(false);
    setCiudadSeleccionada(null);
    setZonas([]);
  };

  useEffect(() => {
    cargarCiudades(estado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const cargarZonas = async (ciudadId) => {
    setCargandoZonas(true);
    const { data } = await supabase.from("zonas").select("id, zona").eq("ciudad_id", ciudadId).order("zona");
    setZonas(data ?? []);
    setCargandoZonas(false);
  };

  const seleccionarCiudad = (c) => {
    setCiudadSeleccionada(c);
    setError("");
    setMensaje("");
    cargarZonas(c.id);
  };

  const agregarCiudad = async (e) => {
    e.preventDefault();
    if (!nuevaCiudad.trim()) return;
    setCreandoCiudad(true);
    setError("");
    setMensaje("");
    try {
      const resultado = await apiFetch("/admin/ciudades", {
        method: "POST",
        body: JSON.stringify({ estado, ciudad: nuevaCiudad.trim() }),
      });
      setNuevaCiudad("");
      invalidarCacheUbicaciones();
      await cargarCiudades(estado);
      setMensaje(
        resultado.coordenadasEncontradas
          ? "Ciudad agregada, con coordenadas para el mapa."
          : "Ciudad agregada, pero no se encontraron coordenadas automáticas — el mapa no se moverá a ella todavía."
      );
    } catch (err) {
      setError(err.message || "No fue posible agregar la ciudad.");
    } finally {
      setCreandoCiudad(false);
    }
  };

  const agregarZona = async (e) => {
    e.preventDefault();
    if (!nuevaZona.trim() || !ciudadSeleccionada) return;
    setCreandoZona(true);
    setError("");
    setMensaje("");
    try {
      await apiFetch("/admin/zonas", {
        method: "POST",
        body: JSON.stringify({ ciudadId: ciudadSeleccionada.id, zona: nuevaZona.trim() }),
      });
      setNuevaZona("");
      invalidarCacheUbicaciones();
      await cargarZonas(ciudadSeleccionada.id);
      setMensaje("Zona agregada.");
    } catch (err) {
      setError(err.message || "No fue posible agregar la zona.");
    } finally {
      setCreandoZona(false);
    }
  };

  const eliminarCiudad = async (c) => {
    if (!window.confirm(`¿Borrar "${c.ciudad}"? Esto también borra sus zonas.`)) return;
    setBorrandoCiudadId(c.id);
    setError("");
    setMensaje("");
    try {
      await apiFetch(`/admin/ciudades/${c.id}`, { method: "DELETE" });
      invalidarCacheUbicaciones();
      await cargarCiudades(estado);
      setMensaje("Ciudad eliminada.");
    } catch (err) {
      setError(err.message || "No fue posible eliminar la ciudad.");
    } finally {
      setBorrandoCiudadId(null);
    }
  };

  const eliminarZona = async (z) => {
    if (!window.confirm(`¿Borrar la zona "${z.zona}"?`)) return;
    setBorrandoZonaId(z.id);
    setError("");
    setMensaje("");
    try {
      await apiFetch(`/admin/zonas/${z.id}`, { method: "DELETE" });
      invalidarCacheUbicaciones();
      await cargarZonas(ciudadSeleccionada.id);
      setMensaje("Zona eliminada.");
    } catch (err) {
      setError(err.message || "No fue posible eliminar la zona.");
    } finally {
      setBorrandoZonaId(null);
    }
  };

  return (
    <div className="card-white-container">
      <div className="owner-usuarios-card-header">
        <MapPin size={24} color="#D4AF37" />
        <h2 className="owner-usuarios-card-title">Ciudades y Zonas</h2>
      </div>
      <p style={{ color: "#6b7280", fontSize: 14, marginTop: 0, marginBottom: 16 }}>
        Agrega ciudades y zonas nuevas para que aparezcan en el filtro de Explorar y al dar de alta una barbería.
      </p>

      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {mensaje && <p style={{ color: "#15803d" }}>{mensaje}</p>}

      <div style={{ marginBottom: 20, maxWidth: 320 }}>
        <label className="owner-usuarios-label">Estado</label>
        <select className="owner-usuarios-input" value={estado} onChange={(e) => setEstado(e.target.value)}>
          {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          <h3 className="sub-section-title-large">Ciudades en {estado}</h3>
          <form onSubmit={agregarCiudad} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              className="owner-usuarios-input"
              placeholder="Nueva ciudad"
              value={nuevaCiudad}
              onChange={(e) => setNuevaCiudad(e.target.value)}
            />
            <button type="submit" className="owner-usuarios-submit-btn" style={{ maxWidth: 130, marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} disabled={creandoCiudad || !nuevaCiudad.trim()}>
              <Plus size={16} /> Agregar
            </button>
          </form>
          <div className="accounts-list-stack">
            {cargandoCiudades && <p style={{ color: "#6b7280", fontSize: 14, padding: 8 }}>Cargando...</p>}
            {!cargandoCiudades && ciudades.map((c) => (
              <div
                key={c.id}
                className="account-row-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  border: ciudadSeleccionada?.id === c.id ? "1.5px solid #D4AF37" : "1px solid transparent",
                }}
              >
                <button
                  type="button"
                  style={{ flex: 1, textAlign: "left", cursor: "pointer", border: "none", background: "none", padding: 0 }}
                  onClick={() => seleccionarCiudad(c)}
                >
                  {c.ciudad}
                </button>
                <button
                  type="button"
                  title="Eliminar ciudad"
                  disabled={borrandoCiudadId === c.id}
                  onClick={() => eliminarCiudad(c)}
                  style={{ border: "none", background: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!cargandoCiudades && ciudades.length === 0 && (
              <p style={{ color: "#6b7280", fontSize: 14, padding: 8 }}>Todavía no hay ciudades en este estado.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="sub-section-title-large">
            {ciudadSeleccionada ? `Zonas en ${ciudadSeleccionada.ciudad}` : "Selecciona una ciudad"}
          </h3>
          {ciudadSeleccionada ? (
            <>
              <form onSubmit={agregarZona} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  className="owner-usuarios-input"
                  placeholder="Nueva zona"
                  value={nuevaZona}
                  onChange={(e) => setNuevaZona(e.target.value)}
                />
                <button type="submit" className="owner-usuarios-submit-btn" style={{ maxWidth: 130, marginTop: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} disabled={creandoZona || !nuevaZona.trim()}>
                  <Plus size={16} /> Agregar
                </button>
              </form>
              <div className="accounts-list-stack">
                {cargandoZonas && <p style={{ color: "#6b7280", fontSize: 14, padding: 8 }}>Cargando...</p>}
                {!cargandoZonas && zonas.map((z) => (
                  <div key={z.id} className="account-row-card" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: 1 }}>{z.zona}</span>
                    <button
                      type="button"
                      title="Eliminar zona"
                      disabled={borrandoZonaId === z.id}
                      onClick={() => eliminarZona(z)}
                      style={{ border: "none", background: "none", color: "#b91c1c", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {!cargandoZonas && zonas.length === 0 && (
                  <p style={{ color: "#6b7280", fontSize: 14, padding: 8 }}>Todavía no hay zonas en esta ciudad.</p>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: "#6b7280", fontSize: 14, padding: 8 }}>Elige una ciudad de la izquierda para agregarle zonas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
