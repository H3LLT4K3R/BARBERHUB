import { useState, useEffect, useMemo } from 'react';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { supabase } from "../../../lib/supabase.js";
import { apiFetch } from "../../../utils/api.js";
import { ESTADOS, ciudadesDe, zonasDe } from "../data/ubicaciones.js";
import { getOpenStreetMapUrl } from "../../../utils/openStreetMap.js";
import "../styles/explorar.css";

const CENTRO_MEXICO = [23.6345, -102.5528];

const iconoBarberia = divIcon({
  className: 'explorar-map-marker',
  html: '<span aria-hidden="true">💈</span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

function AjustarVistaMapa({ barberias }) {
  const map = useMap();

  useEffect(() => {
    const puntos = barberias.filter((b) => b.lat != null && b.lng != null).map((b) => [b.lat, b.lng]);
    if (puntos.length) map.fitBounds(puntos, { padding: [28, 28], maxZoom: 14 });
  }, [barberias, map]);

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
                    {ciudadesDe(estado).map((c) => <option key={c} value={c}>{c}</option>)}
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
                    {zonasDe(estado, ciudad).map((z) => <option key={z} value={z}>{z}</option>)}
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
                  {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"].map((h) => (
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
                    <div className="explorar-barberia-icon">💈</div>
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
                          className="explorar-profile-link"
                          style={{ padding: "2px 0" }}
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
            <AjustarVistaMapa barberias={barberiasFiltradas} />
            {barberiasFiltradas.filter((b) => b.lat != null && b.lng != null).map((barberia) => (
              <Marker key={barberia.id} position={[barberia.lat, barberia.lng]} icon={iconoBarberia}>
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
