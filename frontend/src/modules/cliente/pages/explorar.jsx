import { useState, useEffect, useMemo } from 'react';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BARBERIAS, generarSlots } from "../data/barberias.js";
import { getStoredUser } from "../../../utils/api.js";
import "../styles/explorar.css";

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
};

export default function Explorar() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [ubicacion, setUbicacion] = useState(null);
  const [radio, setRadio] = useState(15);
  const [filtroServicio] = useState(''); 
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [horaFiltro, setHoraFiltro] = useState('');

  // ── GEOLOCALIZACIÓN ──
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

  // ── FILTRADO DINÁMICO ──
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

  // ── MAPEO DE ZOOM ──
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

  // ── PANTALLA DE CARGA ──
  if (!ubicacion) {
    return (
      <div className="explorar-pantalla-carga">
        <div className="explorar-indicador-carga"></div>
        <p>Ubicándote en el mapa...</p>
      </div>
    );
  }

  return (
    <div className="explorar-contenedor">
      <div className="explorar-layout-principal">
        
        {/* BLOQUE IZQUIERDO: FILTROS Y TARJETAS */}
        <div className="explorar-contenido">
          
          {/* BANNER DE FILTROS */}
          <div className="explorar-seccion-filtros">
            <div className="explorar-filtros-izquierda">
              <h2 className="explorar-titulo-seccion">Buscar por Disponibilidad</h2>
              
              <div className="explorar-grupo-entradas">
                <div className="explorar-campo-filtro">
                  <label className="explorar-etiqueta-filtro">FECHA</label>
                  <input 
                    type="date"
                    value={fechaFiltro}
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    className="explorar-input-fecha"
                  />
                </div>

                <div className="explorar-campo-filtro">
                  <label className="explorar-etiqueta-filtro">HORA</label>
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

            {/* CONTROL DE RADIO */}
            <div className="explorar-control-radio">
              <label className="explorar-etiqueta-radio">
                Radio de búsqueda: <span>{radio} km</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={radio} 
                onChange={(e) => setRadio(Number(e.target.value))}
                className="explorar-deslizador-radio"
              />
            </div>
          </div>

          {/* LISTA DE BARBERÍAS */}
          <div className="explorar-lista-barberias">
            {barberiasFiltradas.length === 0 && (
              <div className="explorar-lista-vacia">
                <p>No hay barberías que cumplan con los filtros en este rango de {radio}km.</p>
              </div>
            )}

            {barberiasFiltradas.map((b) => {
              const slots = generarSlots(b).slice(0, 6);
              const unavailableSlots = ['10:00', '11:30', '16:00']; 
              return (
                <div key={b.id} className="explorar-tarjeta-barberia">
                  
                  {/* BLOQUE DATOS */}
                  <div className="explorar-tarjeta-info">
                    <div className="explorar-icono-barberia">💈</div>
                    <div className="explorar-detalles-barberia">
                      <h3 className="explorar-nombre-barberia">{b.nombre}</h3>
                      
                      <div className="explorar-valoracion">
                        <div className="explorar-estrellas">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`explorar-estrella ${i < Math.floor(b.rating) ? 'activa' : 'inactiva'}`}
                            />
                          ))}
                        </div>
                        <span className="explorar-total-opiniones">{b.rating} ({b.totalOpiniones || 14} opiniones)</span>
                      </div>

                      <p className="explorar-direccion-barberia">
                        <MapPin className="explorar-icono-ubicacion" />
                        {b.direccion}
                      </p>

                      <div className="explorar-distancia-etiqueta">
                        A {b.dist} km de ti
                      </div>

                      <p className="explorar-precio-barberia">
                        Servicio desde ${b.precioEstimado || 150} pesos
                      </p>
                    </div>
                  </div>

                  {/* BLOQUE HORARIOS */}
                  <div className="explorar-tarjeta-horarios">
                    <div className="explorar-seccion-turnos">
                      <p className="explorar-titulo-turnos">Horarios disponibles hoy:</p>
                      <div className="explorar-grilla-turnos">
                        {slots.map((hora) => {
                          const estaOcupado = unavailableSlots.includes(hora);
                          return (
                            <button
                              key={hora}
                              onClick={() => {
                                if (user) {
                                  navigate(`/barberia/${b.id}?hora=${hora}`);
                                } else {
                                  navigate('/login', { state: { from: `/barberia/${b.id}?hora=${hora}` } });
                                }
                              }}
                              className={`explorar-boton-turno ${estaOcupado ? 'ocupado' : ''}`}
                              disabled={estaOcupado}
                            >
                              {hora}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/barberia/${b.id}`)}
                      className="explorar-enlace-perfil"
                    >
                      Ver perfil de barbería 
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* MAPA */}
        <div className="explorar-contenedor-mapa">
          <iframe
            title="Mapa BarberHub Dinámico"
            className="explorar-iframe-mapa"
            src={mapaUrl}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

      </div>
    </div>
  );
}