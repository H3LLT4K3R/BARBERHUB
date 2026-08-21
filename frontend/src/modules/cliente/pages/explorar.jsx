import { useState, useEffect, useMemo } from 'react';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { supabase } from "../../../lib/supabase.js";
import { apiFetch } from "../../../utils/api.js";
import { ESTADOS, ciudadesDe, zonasDe, coordenadasDe } from "../data/ubicaciones.js";
import { getOpenStreetMapUrl } from "../../../utils/openStreetMap.js";
import "../styles/explorar.css";

const CENTRO_MEXICO = [23.6345, -102.5528];

function urlFotoBarberia(coverPath) {
  if (!coverPath) return null;
  return supabase.storage.from("perfiles").getPublicUrl(coverPath).data.publicUrl;
}

// Ícono del pin en el mapa: si la barbería tiene foto de portada se muestra esa,
// si no, cae al ícono genérico de la navaja/poste de barbería.
function crearIconoBarberia(fotoUrl) {
  const contenido = fotoUrl
    ? `<img src="${fotoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : '<span aria-hidden="true">💈</span>';
  return divIcon({
    className: 'explorar-map-marker',
    html: contenido,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}

const iconoBarberia = crearIconoBarberia(null);

function AjustarVistaMapa({ barberias, coordenadasCiudad }) {
  const map = useMap();

  useEffect(() => {
    const puntos = barberias.filter((b) => b.lat != null && b.lng != null).map((b) => [b.lat, b.lng]);
    // Cancela cualquier animación (flyTo/panTo) en curso antes de iniciar otra: si el
    // efecto se dispara dos veces seguidas (p. ej. el filtro cambia y, poco después,
    // llegan las coordenadas de la ciudad de forma asíncrona), llamar a flyTo de nuevo
    // sin detener la anterior corrompe la animación interna de Leaflet y el mapa se
    // queda congelado sin moverse nunca.
    map.stop();
    if (puntos.length) {
      // Si hay barberías en el filtro actual, el mapa se ajusta a ellas (más útil
      // que solo centrarse en la ciudad, ya que muestra a todas a la vez).
      map.fitBounds(puntos, { padding: [28, 28], maxZoom: 14 });
    } else if (coordenadasCiudad) {
      // Todavía no hay barberías en esa ciudad/zona, pero sí sabemos dónde está:
      // el mapa se mueve ahí de todos modos, para que la ciudad elegida en el
      // filtro siempre tenga relación visual con el mapa.
      map.flyTo([coordenadasCiudad.lat, coordenadasCiudad.lng], 13);
    } else {
      map.flyTo(CENTRO_MEXICO, 5);
    }
  }, [barberias, coordenadasCiudad, map]);

  return null;
}

function normalizarTexto(texto) {
  return (texto ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function Explorar({ searchQuery = "" }) {
  const navigate = useNavigate();
  const [barberias, setBarberias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [slotsPorBarberia, setSlotsPorBarberia] = useState({});
  const [estado, setEstado] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [zona, setZona] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [opcionesCiudad, setOpcionesCiudad] = useState([]);
  const [opcionesZona, setOpcionesZona] = useState([]);
  const [coordenadasCiudad, setCoordenadasCiudad] = useState(null);

  useEffect(() => {
    let cancelado = false;
    ciudadesDe(estado).then((lista) => { if (!cancelado) setOpcionesCiudad(lista); });
    return () => { cancelado = true; };
  }, [estado]);

  useEffect(() => {
    let cancelado = false;
    zonasDe(estado, ciudad).then((lista) => { if (!cancelado) setOpcionesZona(lista); });
    return () => { cancelado = true; };
  }, [estado, ciudad]);

  useEffect(() => {
    let cancelado = false;
    coordenadasDe(estado, ciudad).then((coords) => { if (!cancelado) setCoordenadasCiudad(coords); });
    return () => { cancelado = true; };
  }, [estado, ciudad]);

  useEffect(() => {
    let cancelado = false;

    supabase
      .from("barberias_public")
      .select("*")
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) {
          console.error(error);
          setBarberias([]);
        } else {
          setBarberias(data ?? []);
        }
        setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const barberiasPorUbicacion = useMemo(() => {
    const busqueda = normalizarTexto(searchQuery.trim());
    return barberias
      .filter((b) => !estado || b.state === estado)
      .filter((b) => !ciudad || b.city === ciudad)
      .filter((b) => !zona || b.zone === zona)
      .filter((b) => !busqueda || normalizarTexto(b.name).includes(busqueda));
  }, [barberias, estado, ciudad, zona, searchQuery]);

  useEffect(() => {
    if (!fecha) return;

    barberiasPorUbicacion.forEach((b) => {
      const clave = `${b.id}:${fecha}`;
      if (slotsPorBarberia[clave]) return;
      const params = new URLSearchParams({ barberiaId: b.id, fecha });
      apiFetch(`/citas/disponibilidad?${params.toString()}`)
        .then((data) => {
          setSlotsPorBarberia((prev) => ({ ...prev, [clave]: data.slots ?? [] }));
        })
        .catch(() => {
          setSlotsPorBarberia((prev) => ({ ...prev, [clave]: [] }));
        });
    });
  }, [barberiasPorUbicacion, fecha, slotsPorBarberia]);

  const barberiasFiltradas = useMemo(() => {
    if (!fecha) return barberiasPorUbicacion;

    return barberiasPorUbicacion.filter((b) => {
      const slots = slotsPorBarberia[`${b.id}:${fecha}`];
      if (!slots) return true; // aún cargando disponibilidad, no ocultar todavía
      if (hora) return slots.some((s) => s.hora === hora && s.disponible);
      return slots.some((s) => s.disponible);
    });
  }, [barberiasPorUbicacion, fecha, hora, slotsPorBarberia]);

  if (cargando) {
    return (
      <div className="explorar-loading">
        <div className="explorar-spinner"></div>
        <p>Cargando barberías...</p>
      </div>
    );
  }

  return (
    <div className="explorar-container">
      <div className="explorar-main">

        <div className="explorar-content">
          <div className="explorar-section-header">
            <div className="explorar-header-left">
              <h2 className="explorar-title">Barberías</h2>
              <div className="explorar-filters">
                <div className="explorar-filter-group">
                  <label className="explorar-filter-label">ESTADO</label>
                  <select
                    className="explorar-select-hora"
                    value={estado}
                    onChange={(e) => { setEstado(e.target.value); setCiudad(''); setZona(''); }}
                  >
                    <option value="">Todos</option>
                    {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="explorar-filter-group">
                  <label className="explorar-filter-label">CIUDAD</label>
                  <select
                    className="explorar-select-hora"
                    value={ciudad}
                    onChange={(e) => { setCiudad(e.target.value); setZona(''); }}
                    disabled={!estado}
                  >
                    <option value="">Todas</option>
                    {opcionesCiudad.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="explorar-filter-group">
                  <label className="explorar-filter-label">ZONA</label>
                  <select
                    className="explorar-select-hora"
                    value={zona}
                    onChange={(e) => setZona(e.target.value)}
                    disabled={!ciudad}
                  >
                    <option value="">Todas</option>
                    {opcionesZona.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="explorar-filters">
              <div className="explorar-filter-group">
                <label className="explorar-filter-label">FECHA</label>
                <input
                  type="date"
                  className="explorar-input-fecha"
                  value={fecha}
                  onChange={(e) => { setFecha(e.target.value); setHora(''); }}
                />
              </div>
              <div className="explorar-filter-group">
                <label className="explorar-filter-label">HORA</label>
                <select
                  className="explorar-select-hora"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  disabled={!fecha}
                >
                  <option value="">Cualquier hora</option>
                  {[
                    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
                    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
                    "17:00", "17:30", "18:00", "18:30", "19:00",
                  ].map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="explorar-barberias-list">
            {barberiasFiltradas.length === 0 && (
              <div className="explorar-empty">
                <p>No hay barberías que coincidan con estos filtros.</p>
              </div>
            )}

            {barberiasFiltradas.map((b) => {
              const slots = (slotsPorBarberia[`${b.id}:${fecha}`] ?? []).slice(0, 6);

              return (
                <div key={b.id} className="explorar-barberia-card">

                  <div className="explorar-barberia-left-block">
                    <div className="explorar-barberia-icon">
                      {b.cover_path ? (
                        <img src={urlFotoBarberia(b.cover_path)} alt="" />
                      ) : (
                        '💈'
                      )}
                    </div>
                    <div className="explorar-barberia-info">
                      <h3 className="explorar-barberia-name">{b.name}</h3>
                      <div className="explorar-barberia-rating">
                        <div className="explorar-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="explorar-star"
                              style={{ fill: i < Math.floor(b.rating) ? '#E9C46A' : 'none', stroke: '#E9C46A' }}
                            />
                          ))}
                        </div>
                        <span className="explorar-opiniones">{b.rating} ({b.total_opiniones} opiniones)</span>
                      </div>
                      <p className="explorar-barberia-address">
                        <MapPin className="explorar-address-icon" />
                        {[b.zone, b.city, b.state].filter(Boolean).join(', ')}
                      </p>
                      {b.lat != null && b.lng != null && (
                        <button
                          type="button"
                          className="explorar-profile-link explorar-map-button"
                          onClick={() => window.open(getOpenStreetMapUrl(b.lat, b.lng), "_blank", "noopener,noreferrer")}
                        >
                          Ver ubicación en el mapa
                        </button>
                      )}
                      <p className="explorar-barberia-price">
                        Servicio desde ${b.precio_desde ?? 0} {b.currency_code}
                      </p>
                    </div>
                  </div>

                  <div className="explorar-barberia-right-block">
                    {fecha && (
                      <div className="explorar-slots-section">
                        <p className="explorar-slots-title">Horarios disponibles:</p>
                        <div className="explorar-slots">
                          {slots.length === 0 && <span style={{ fontSize: "0.85rem", color: "#777" }}>Sin horarios ese día</span>}
                          {slots.map((slot) => (
                            <button
                              key={slot.hora}
                              onClick={() =>
                                navigate(`/barberia-perfil/${b.id}`, { state: { volverA: "/explorar" } })
                              }
                              className={`explorar-slot ${!slot.disponible ? 'no-disponible' : ''}`}
                              disabled={!slot.disponible}
                            >
                              {slot.hora}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() =>
                        navigate(`/barberia-perfil/${b.id}`, {
                          state: { volverA: "/explorar" },
                        })
                      }
                      className="explorar-profile-link"
                    >
                      Ver perfil de barbería
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        <div className="explorar-map-container">
          <MapContainer center={CENTRO_MEXICO} zoom={5}
            title="Mapa BarberHub"
            className="explorar-map-iframe"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <AjustarVistaMapa barberias={barberiasFiltradas} coordenadasCiudad={coordenadasCiudad} />
            {barberiasFiltradas.filter((b) => b.lat != null && b.lng != null).map((barberia) => (
              <Marker
                key={barberia.id}
                position={[barberia.lat, barberia.lng]}
                icon={barberia.cover_path ? crearIconoBarberia(urlFotoBarberia(barberia.cover_path)) : iconoBarberia}
              >
                <Popup>
                  <strong>{barberia.name}</strong><br />
                  {barberia.address_line1}, {barberia.city}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}
