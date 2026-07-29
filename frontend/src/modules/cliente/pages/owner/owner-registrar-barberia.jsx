import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Building2, MapPin } from "lucide-react";
import { supabase } from "../../../../lib/supabase.js";
import { ESTADOS, ciudadesDe, zonasDe } from "../../data/ubicaciones.js";
import "../../styles/owner/owner-usuarios.css";

const CENTRO_DEFAULT = [19.0414, -98.2063]; // Puebla

const iconoPin = divIcon({
  className: "explorar-map-marker",
  html: '<span aria-hidden="true">📍</span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function SeleccionarPin({ onSeleccionar }) {
  useMapEvents({
    click(e) {
      onSeleccionar([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function OwnerRegistrarBarberia() {
  const navigate = useNavigate();
  const [verificando, setVerificando] = useState(true);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    descripcion: "",
    direccion: "",
    estado: "",
    ciudad: "",
    zona: "",
  });
  const [pin, setPin] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function verificarMembresia() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      const { data } = await supabase
        .from("barberia_memberships")
        .select("id")
        .eq("profile_id", uid)
        .eq("role", "owner")
        .eq("is_active", true)
        .maybeSingle();

      if (cancelado) return;
      if (data) {
        navigate("/perfilBarberia", { replace: true });
        return;
      }
      setVerificando(false);
    }

    verificarMembresia();
    return () => {
      cancelado = true;
    };
  }, [navigate]);

  const actualizarCampo = (campo, valor) => {
    setForm((prev) => {
      const next = { ...prev, [campo]: valor };
      if (campo === "estado") {
        next.ciudad = "";
        next.zona = "";
      }
      if (campo === "ciudad") {
        next.zona = "";
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.direccion.trim() || !form.estado || !form.ciudad || !form.zona) {
      setError("Completa nombre, dirección, estado, ciudad y zona.");
      return;
    }

    setEnviando(true);
    setError("");

    const baseSlug = slugify(form.nombre) || "barberia";
    let intento = 0;

    while (intento < 5) {
      const slugCandidato = intento === 0 ? baseSlug : `${baseSlug}-${intento}`;
      const location = pin ? `SRID=4326;POINT(${pin[1]} ${pin[0]})` : null;

      const { error: rpcError } = await supabase.rpc("create_barberia", {
        p_slug: slugCandidato,
        p_name: form.nombre.trim(),
        p_address: form.direccion.trim(),
        p_city: form.ciudad,
        p_state: form.estado,
        p_location: location,
        p_zone: form.zona,
        p_phone: form.telefono.trim() || null,
        p_description: form.descripcion.trim() || null,
      });

      if (!rpcError) {
        navigate("/perfilBarberia", { replace: true });
        return;
      }

      if (rpcError.message?.includes("duplicate key") && rpcError.message?.includes("slug")) {
        intento += 1;
        continue;
      }

      setError(rpcError.message || "No fue posible registrar tu barbería.");
      setEnviando(false);
      return;
    }

    setError("No fue posible generar un identificador único para tu barbería. Intenta con otro nombre.");
    setEnviando(false);
  };

  if (verificando) {
    return <div className="owner-usuarios-container"><p>Verificando tu cuenta...</p></div>;
  }

  return (
    <div className="owner-usuarios-container">
      <h1 className="owner-usuarios-title">Registra tu barbería</h1>
      <p className="owner-usuarios-description">
        Completa estos datos para crear tu barbería en Barber Hub. Podrás agregar servicios, horarios y publicarla desde el perfil de tu barbería.
      </p>

      <div className="owner-usuarios-card">
        <div className="owner-usuarios-card-header">
          <Building2 size={24} color="#D4AF37" />
          <h2 className="owner-usuarios-card-title">Datos de tu barbería</h2>
        </div>

        <form className="owner-usuarios-form" onSubmit={handleSubmit}>
          <div>
            <label className="owner-usuarios-label">Nombre de la barbería</label>
            <input
              type="text"
              className="owner-usuarios-input"
              placeholder="Ej. Urban Cuts"
              value={form.nombre}
              onChange={(e) => actualizarCampo("nombre", e.target.value)}
            />
          </div>

          <div>
            <label className="owner-usuarios-label">Teléfono</label>
            <input
              type="tel"
              className="owner-usuarios-input"
              placeholder="Ej. 2221234567"
              value={form.telefono}
              onChange={(e) => actualizarCampo("telefono", e.target.value)}
            />
          </div>

          <div>
            <label className="owner-usuarios-label">Descripción</label>
            <textarea
              className="owner-usuarios-input"
              rows={3}
              placeholder="Cuéntale a tus clientes qué hace especial a tu barbería"
              value={form.descripcion}
              onChange={(e) => actualizarCampo("descripcion", e.target.value)}
            />
          </div>

          <div>
            <label className="owner-usuarios-label">Dirección</label>
            <input
              type="text"
              className="owner-usuarios-input"
              placeholder="Calle y número"
              value={form.direccion}
              onChange={(e) => actualizarCampo("direccion", e.target.value)}
            />
          </div>

          <div className="owner-usuarios-role-container">
            <div style={{ flex: 1 }}>
              <label className="owner-usuarios-label">Estado</label>
              <select className="owner-usuarios-input" value={form.estado} onChange={(e) => actualizarCampo("estado", e.target.value)}>
                <option value="">Selecciona</option>
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label className="owner-usuarios-label">Ciudad</label>
              <select className="owner-usuarios-input" value={form.ciudad} onChange={(e) => actualizarCampo("ciudad", e.target.value)} disabled={!form.estado}>
                <option value="">Selecciona</option>
                {ciudadesDe(form.estado).map((ciudad) => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label className="owner-usuarios-label">Zona</label>
              <select className="owner-usuarios-input" value={form.zona} onChange={(e) => actualizarCampo("zona", e.target.value)} disabled={!form.ciudad}>
                <option value="">Selecciona</option>
                {zonasDe(form.estado, form.ciudad).map((zona) => (
                  <option key={zona} value={zona}>{zona}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="owner-usuarios-label">
              <MapPin size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Ubicación en el mapa (opcional)
            </label>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
              Haz clic en el mapa para marcar dónde está tu barbería. Puedes omitir este paso.
            </p>
            <div style={{ height: 260, borderRadius: 12, overflow: "hidden", border: "1px solid #d1d5db" }}>
              <MapContainer center={pin ?? CENTRO_DEFAULT} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <SeleccionarPin onSeleccionar={setPin} />
                {pin && <Marker position={pin} icon={iconoPin} />}
              </MapContainer>
            </div>
          </div>

          {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

          <button type="submit" className="owner-usuarios-submit-btn" disabled={enviando}>
            {enviando ? "Registrando..." : "Registrar mi barbería"}
          </button>
        </form>
      </div>
    </div>
  );
}
