import { useState, useEffect, useMemo } from 'react';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { BARBERIAS, generarSlots } from "../data/barberias.js";
// La ruta correcta para archivos en /pages/ hacia utils
import { getStoredUser } from "../../../utils/api.js";
import "../styles/explorar.css";

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1));
};

export default function Explorar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [ubicacion, setUbicacion] = useState(null);
  const [radio, setRadio] = useState(5);
  const [filtroServicio, setFiltroServicio] = useState('');

  // Nuevos estados para el filtro de disponibilidad 
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [horaFiltro, setHoraFiltro] = useState('');

  // geolocalización 
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacion([pos.coords.latitude, pos.coords.longitude]);
        },
        async () => {
          try {
            const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
            const data = await res.json();
            if (data.latitude && data.longitude) {
              setUbicacion([parseFloat(data.latitude), parseFloat(data.longitude)]);
            } else {
              setUbicacion([19.0433, -98.2019]); 
            }
          } catch {
            setUbicacion([19.0433, -98.2019]);
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setTimeout(() => {
        setUbicacion([19.0433, -98.2019]);
      }, 0);
    }
  }, []);

  //  FILTRADO DE BARBERÍAS 
  const barberiasFiltradas = useMemo(() => {
    if (!ubicacion) return [];
    const [lat, lon] = ubicacion;

    return BARBERIAS
      .filter((b) => b.abierto)
      .map((b) => ({
        ...b,
        dist: calcularDistancia(lat, lon, b.lat, b.lng),
      }))
      .filter((b) => b.dist <= radio)
      .filter((b) => {
        if (!filtroServicio) return true;
        const serviciosBH = b.servicios?.map(s => s.toLowerCase()) || [];
        return serviciosBH.includes(filtroServicio.toLowerCase()) || b.categoria?.toLowerCase() === filtroServicio.toLowerCase();
      })
      .sort((a, b) => a.dist - b.dist);
  }, [ubicacion, radio, filtroServicio]);

  // MAPEO DINÁMICO 
  const mapaUrl = useMemo(() => {
    if (!ubicacion) return '';
    const [lat, lon] = ubicacion;

    let zoom;
    if (radio <= 2) zoom = 15;
    else if (radio <= 5) zoom = 14;
    else if (radio <= 15) zoom = 12;
    else if (radio <= 30) zoom = 11;
    else zoom = 10;

    return `https://maps.google.com/maps?q=${lat},${lon}&z=${zoom}&output=embed`;
  }, [ubicacion, radio]);

  //PANTALLA DE CARGA
  if (!ubicacion) {
    return (
      <div className="explorar-loading">
        <div className="explorar-spinner"></div>
        <p>Ubicándote en el mapa...</p>
      </div>
    );
  }

  return (
    <div className="explorar-container">
      <div className="explorar-main">

        <div className="explorar-content">
          <div className="explorar-section-header">
            <div className="explorar-header-left">
              <h2 className="explorar-title">Buscar por Disponibilidad</h2>
              <div className="explorar-filters">
                <div className="explorar-filter-group">
                  <label className="explorar-filter-label">FECHA</label>
                  <input
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    className="explorar-input-fecha"
                  />
                </div>
                <div className="explorar-filter-group">
                  <label className="explorar-filter-label">HORA</label>
                  <select
                    value={horaFiltro}
                    onChange={(e) => setHoraFiltro(e.target.value)}
                    className="explorar-select-hora"
                  >
                    <option value="">Cualquier hora</option>
                    <option value="09:00">09:00 a.m.</option>
                    <option value="10:00">10:00 a.m.</option>
                    <option value="11:00">11:00 a.m.</option>
                    <option value="12:00">12:00 p.m.</option>
                    <option value="13:00">01:00 p.m.</option>
                    <option value="14:00">02:00 p.m.</option>
                    <option value="15:00">03:00 p.m.</option>
                    <option value="16:00">04:00 p.m.</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="explorar-radius-control">
              <label className="explorar-radius-label">
                Radio de búsqueda: <span>{radio} km</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={radio}
                onChange={(e) => setRadio(Number(e.target.value))} 
                className="explorar-radius-slider"
              />
            </div>
          </div>

          <div className="explorar-barberias-list">
            {barberiasFiltradas.length === 0 && (
              <div className="explorar-empty">
                <p>No hay barberías que cumplan con los filtros en este rango de {radio}km.</p>
              </div>
            )}

            {barberiasFiltradas.map((b) => {
              const slots = generarSlots(b).slice(0, 6);
              const horariosNoDisponibles = ['10:00', '11:30', '16:00'];

              return (
                <div key={b.id} className="explorar-barberia-card">

                  <div className="explorar-barberia-left-block">
                    <div className="explorar-barberia-icon">💈</div>
                    <div className="explorar-barberia-info">
                      <h3 className="explorar-barberia-name">{b.nombre}</h3>
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
                        <span className="explorar-opiniones">{b.rating} ({b.totalOpiniones || 14} opiniones)</span>
                      </div>
                      <p className="explorar-barberia-address">
                        <MapPin className="explorar-address-icon" />
                        {b.direccion}
                      </p>
                      <div className="explorar-barberia-distance">
                        A {b.dist} km de ti
                      </div>
                      <p className="explorar-barberia-price">
                        Servicio desde ${b.precioEstimado || 150} pesos
                      </p>
                    </div>
                  </div>

                  <div className="explorar-barberia-right-block">
                    <div className="explorar-slots-section">
                      <p className="explorar-slots-title">Horarios disponibles hoy:</p>
                      <div className="explorar-slots">
                        {slots.map((hora) => {
                          const estaOcupado = horariosNoDisponibles.includes(hora);
                          return (
                            <button
                              key={hora}
                              onClick={() => {
                                if (user) {
                                  navigate("/agenda-local", {
                                    state: { volverA: "/explorar" },
                                  });
                                } else {
                                  navigate("/agenda-local", { state: { volverA: "/explorar" } });
                                }
                              }}
                              className={`explorar-slot ${estaOcupado ? 'no-disponible' : ''}`}
                              disabled={estaOcupado}
                            >
                              {hora}
                            </button>
                          );
                        })}
                      </div>
                    </div>

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
          <iframe
            title="Mapa BarberHub Dinámico"
            className="explorar-map-iframe"
            src={mapaUrl}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

      </div>
      <span className="explorar-oculto" onClick={() => setFiltroServicio('')}>{filtroServicio}</span>
    </div>
  );
}
