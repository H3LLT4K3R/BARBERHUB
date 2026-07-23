import React, { useEffect, useState, useRef } from 'react';
import { 
  User, MapPin, MessageSquare, Share2, Heart, 
  Plus, Trash2, Upload, Scissors, Edit2, Check, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';

import "../../styles/Barberias/perfilbarberia.css";
import { getOpenStreetMapEmbedUrl } from "../../../../utils/openStreetMap.js";

export default function PerfilBarberia() {
  // === ESTADOS ===
  const [activeTab, setActiveTab] = useState('Acerca');
  const [nombreBarberia, setNombreBarberia] = useState('Mathew McCoy - Barberia profesional');
  const [avatarImage, setAvatarImage] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [chatActive, setChatActive] = useState(false);

  const [ubicacion, setUbicacion] = useState('950 W Mesquite Blvd, Mesquite, NV 89027, Estados Unidos');
  const [coordenadas, setCoordenadas] = useState({ lat: 36.8055, lng: -114.1077 });
  const [horarioSemana, setHorarioSemana] = useState('09.00 am - 08.00 pm');
  const [horarioFinde, setHorarioFinde] = useState('09.00 am - 09.00 pm');
  const [isEditingHours, setIsEditingHours] = useState(false);

  const [serviciosList, setServiciosList] = useState([
    { id: 1, nombre: 'Corte Clásico', precio: '$25.00' },
    { id: 2, nombre: 'Arreglo de Barba', precio: '$15.00' }
  ]);
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState('');
  const [nuevoServicioPrecio, setNuevoServicioPrecio] = useState('');

  const [skillsImages, setSkillsImages] = useState({
    0: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80',
    1: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80',
    2: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80',
    3: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80',
  });

  const [subTabCalendario, setSubTabCalendario] = useState('Horarios');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 11, 1));
  const [selectedDay, setSelectedDay] = useState(null);
  
  const [horariosBarberos, setHorariosBarberos] = useState({
    '2026-12-01': '12:00 Pm - 3:00 Pm',
    '2026-12-02': '12:00 Pm - 3:00 Pm'
  });
  const [fechasImportantes, setFechasImportantes] = useState({
    '2026-12-25': 'Navidad (Cerrado)'
  });

  const [inputHoraInicio, setInputHoraInicio] = useState('12:00 Pm');
  const [inputHoraFin, setInputHoraFin] = useState('3:00 Pm');
  const [inputFechaEspecialTexto, setInputFechaEspecialTexto] = useState('');

  const fileInputRefs = useRef([]);
  const avatarInputRef = useRef(null);

  // Convierte la dirección escrita a coordenadas para mostrarla en OpenStreetMap.
  // Se espera un momento antes de consultar para no enviar una petición por cada tecla.
  useEffect(() => {
    const direccion = ubicacion.trim();
    if (!direccion) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(direccion)}`,
          { signal: controller.signal }
        );
        if (!response.ok) return;
        const [resultado] = await response.json();
        if (resultado) {
          setCoordenadas({ lat: Number(resultado.lat), lng: Number(resultado.lon) });
        }
      } catch (error) {
        if (error.name !== 'AbortError') console.warn('No fue posible localizar la dirección en OpenStreetMap.', error);
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [ubicacion]);

  // === FUNCIONES UTILITARIAS ===

  // 1. Procesador centralizado de imágenes
  const procesarArchivoImagen = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e) => {
    procesarArchivoImagen(e.target.files[0], setAvatarImage);
  };

  const handleSkillImageChange = (index, e) => {
    procesarArchivoImagen(e.target.files[0], (imgBase64) => {
      setSkillsImages(prev => ({ ...prev, [index]: imgBase64 }));
    });
  };

  // 2. Manejo de Servicios Optimizado
  const agregarNuevoServicio = () => {
    if (!nuevoServicioNombre.trim() || !nuevoServicioPrecio.trim()) return;
    
    const nuevo = {
      id: Date.now(),
      nombre: nuevoServicioNombre.trim(),
      precio: nuevoServicioPrecio.startsWith('$') ? nuevoServicioPrecio : `$${nuevoServicioPrecio}`
    };
    
    setServiciosList(prev => [...prev, nuevo]);
    setNuevoServicioNombre('');
    setNuevoServicioPrecio('');
  };

  const actualizarServicio = (id, campo, valor) => {
    setServiciosList(prev => prev.map(servicio => 
      servicio.id === id ? { ...servicio, [campo]: valor } : servicio
    ));
  };

  const eliminarServicio = (id) => {
    setServiciosList(prev => prev.filter(s => s.id !== id));
  };

  // 3. Lógica de Calendario y Fechas
  const cambiarMes = (incremento) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + incremento, 1));
  };

  const guardarConfiguracionDia = () => {
    if (!selectedDay) {
      alert("Por favor selecciona un día del calendario primero.");
      return;
    }
    
    if (subTabCalendario === 'Horarios') {
      if (!inputHoraInicio.trim() || !inputHoraFin.trim()) return;
      setHorariosBarberos(prev => ({
        ...prev,
        [selectedDay]: `${inputHoraInicio} - ${inputHoraFin}`
      }));
    } else {
      if (!inputFechaEspecialTexto.trim()) return;
      setFechasImportantes(prev => ({
        ...prev,
        [selectedDay]: inputFechaEspecialTexto
      }));
      setInputFechaEspecialTexto('');
    }
  };

  const eliminarConfiguracionDia = (fecha, tipo) => {
    if (tipo === 'horario') {
      setHorariosBarberos(prev => {
        const copia = { ...prev };
        delete copia[fecha];
        return copia;
      });
    } else {
      setFechasImportantes(prev => {
        const copia = { ...prev };
        delete copia[fecha];
        return copia;
      });
    }
  };

  const obtenerCiudadBreve = (direccionLarga) => {
    if (!direccionLarga) return 'Sin localización';
    const partes = direccionLarga.split(',');
    return partes.length >= 2 ? partes[1].trim() : direccionLarga;
  };

  // 4. Renderizado de la malla del calendario
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const dayElements = [];
    
    // Celdas vacías del inicio del mes
    for (let i = 0; i < firstDayIndex; i++) {
      dayElements.push(<div key={`empty-${i}`} className="calendar-day-cell empty"></div>);
    }
    
    // Celdas con días
    for (let day = 1; day <= totalDays; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasHorario = !!horariosBarberos[dateString];
      const hasImportant = !!fechasImportantes[dateString];
      const isSelected = selectedDay === dateString;
      
      dayElements.push(
        <div 
          key={day} 
          className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${hasImportant ? 'day-important' : ''} ${hasHorario && !hasImportant ? 'day-has-hours' : ''}`}
          onClick={() => {
            setSelectedDay(dateString);
            
            // Cargar datos en los inputs al hacer clic
            if (horariosBarberos[dateString]) {
              const [inicio, fin] = horariosBarberos[dateString].split(' - ');
              setInputHoraInicio(inicio || '12:00 Pm');
              setInputHoraFin(fin || '3:00 Pm');
            } else {
              setInputHoraInicio('');
              setInputHoraFin('');
            }
            
            if (fechasImportantes[dateString]) {
              setInputFechaEspecialTexto(fechasImportantes[dateString]);
            } else {
              setInputFechaEspecialTexto('');
            }
          }}
        >
          <span className="day-number-label">{day}</span>
          <div className="day-indicators-row">
            {hasHorario && <span className="dot-indicator green"></span>}
            {hasImportant && <span className="dot-indicator red"></span>}
          </div>
        </div>
      );
    }
    return dayElements;
  };

  return (
    <div className="pagina-barberia-global">
      <div className="perfil-clean-wrapper">
        <div className="barber-cards-row-grid-three">
          
          {/* COLUMNA 1 */}
          <div className="layout-column">
            
            <div className="card-profile-black">
              <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden-file-input" accept="image/*" />
              <div className="profile-avatar-circle interactive-avatar" onClick={() => avatarInputRef.current.click()}>
                {avatarImage ? <img src={avatarImage} alt="Perfil" className="avatar-img-preview" /> : <User className="avatar-placeholder-icon" />}
                <div className="avatar-hover-overlay"><Upload className="w-4 h-4 text-white" /></div>
              </div>
              
              <div className="editable-name-container">
                <input 
                  type="text" 
                  value={nombreBarberia} 
                  onChange={(e) => setNombreBarberia(e.target.value)} 
                  className="profile-title-name-input"
                  placeholder="Nombre de la barbería..."
                />
              </div>

              <p className="profile-subtitle-geo">
                <MapPin className="inline-geo-icon" /> {obtenerCiudadBreve(ubicacion)}
              </p>
              
              <div className="profile-quick-actions">
                <button onClick={() => setChatActive(!chatActive)} className={`quick-action-btn ${chatActive ? 'chat-active' : ''}`}>
                  <MessageSquare className="action-svg" />
                  <span>Chat</span>
                </button>
                
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Enlace copiado'); }} className="quick-action-btn share-btn-hover">
                  <Share2 className="action-svg" />
                  <span>Share</span>
                </button>

                <button onClick={() => setIsSaved(!isSaved)} className={`quick-action-btn ${isSaved ? 'saved-active' : ''}`}>
                  <Heart className="action-svg" />
                  <span>{isSaved ? 'Saved!' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div className="card-white-container localization-premium-card">
              <div className="localization-header-block">
                <div className="geo-icon-badge">
                  <MapPin className="w-5 h-5 icon-gold" />
                </div>
                <div className="localization-text-side">
                  <h3 className="card-section-title-modern">Localización</h3>
                  <input 
                    type="text"
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    className="geo-address-input-modern"
                    placeholder="Escribe la dirección..."
                  />
                </div>
              </div>
              <div className="map-container-frame-box-modern">
                <iframe 
                  title="Mapa de OpenStreetMap"
                  src={getOpenStreetMapEmbedUrl(coordenadas.lat, coordenadas.lng)}
                  className="osm-real-map-embed" 
                  allowFullScreen 
                  loading="lazy"
                ></iframe>
              </div>
            </div>

          </div>

          {/* COLUMNA 2 */}
          <div className="card-white-container layout-column flex-between" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="custom-navigation-tabs">
                <button onClick={() => setActiveTab('Acerca')} className={`nav-tab-item ${activeTab === 'Acerca' ? 'active' : ''}`}><User className="w-3 h-3" /> Acerca</button>
                <button onClick={() => setActiveTab('Servicios')} className={`nav-tab-item ${activeTab === 'Servicios' ? 'active' : ''}`}><Scissors className="w-3 h-3" /> Servicios</button>
              </div>

              {activeTab === 'Acerca' && (
                <>
                  <p className="description-paragraph-text">Somos una barbería con mucha experiencia en... <span className="read-more-gold">Leer más...</span></p>
                  <div className="mb-4 bg-black-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="sub-section-title m-0">Horarios de atención</h4>
                      <button onClick={() => setIsEditingHours(!isEditingHours)} className={`modern-hours-toggle-btn ${isEditingHours ? 'editing-active' : ''}`}>{isEditingHours ? <><Check className="w-3 h-3" /> Listo</> : <><Edit2 className="w-3 h-3" /> Modificar</>}</button>
                    </div>
                    <div className="working-hours-list-text">
                      <div className="hours-row mb-1"><span className="day-span-label">Lunes - Viernes</span> {isEditingHours ? <input type="text" value={horarioSemana} onChange={(e) => setHorarioSemana(e.target.value)} className="inline-hours-editor-input" /> : <span className="hours-val">{horarioSemana}</span>}</div>
                      <div className="hours-row"><span className="day-span-label">Sábado - Domingo</span> {isEditingHours ? <input type="text" value={horarioFinde} onChange={(e) => setHorarioFinde(e.target.value)} className="inline-hours-editor-input" /> : <span className="hours-val">{horarioFinde}</span>}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="sub-section-title">Habilidades</h4>
                    <div className="skills-image-display-grid">
                      {["Masaje", "Diseño Personalizado", "Corte De Cejas", "Corte De Cabello"].map((skill, index) => (
                        <div key={index} className="skill-photo-card">
                          <input type="file" ref={el => fileInputRefs.current[index] = el} onChange={(e) => handleSkillImageChange(index, e)} className="hidden-file-input" accept="image/*" />
                          <div className="skill-image-wrapper" style={{ backgroundImage: `url(${skillsImages[index]})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><span className="skill-floating-price">$150</span></div>
                          <div className="skill-card-footer-info">
                            <p className="skill-label-name">{skill}</p>
                            <button onClick={() => fileInputRefs.current[index].click()} className="clean-upload-trigger-btn"><Upload className="w-2.5 h-2.5" /> Subir imagen</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'Servicios' && (
                <div className="premium-services-panel">
                  <h4 className="sub-section-title-large">Gestión de Servicios</h4>
                  
                  <div className="add-service-inline-card">
                    <h5>Añadir Servicio</h5>
                    <div className="add-service-fields-row">
                      <input type="text" placeholder="Nombre" value={nuevoServicioNombre} onChange={(e) => setNuevoServicioNombre(e.target.value)} className="add-service-input-text" />
                      <input type="text" placeholder="Precio ($)" value={nuevoServicioPrecio} onChange={(e) => setNuevoServicioPrecio(e.target.value)} className="add-service-input-price" />
                      <button onClick={agregarNuevoServicio} className="add-service-submit-pill"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="services-cards-stack">
                    {serviciosList.map(s => (
                      <div key={s.id} className="service-premium-row-card">
                        <div className="service-inputs-group-block">
                          <Scissors className="w-3.5 h-3.5 icon-gold" />
                          <input type="text" value={s.nombre} onChange={(e) => actualizarServicio(s.id, 'nombre', e.target.value)} className="premium-service-name-input" />
                          <span className="price-tag-prefix">$</span>
                          <input type="text" value={s.precio.replace('$', '')} onChange={(e) => actualizarServicio(s.id, 'precio', e.target.value)} className="premium-service-price-input" />
                        </div>
                        <button onClick={() => eliminarServicio(s.id)} className="delete-service-row-btn"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="btn-primary-gold mt-4">Guardar Cambios</button>
          </div>

          {/* COLUMNA 3 */}
          <div className="card-white-container layout-column">
            <div className="horizontal-stats-header-bar">
              <div className="stat-segment"><span className="stat-top-lbl">Experiencia</span><span className="stat-bottom-val">5 años</span></div>
              <div className="stat-segment border-x border-gray-100"><span className="stat-top-lbl">Clientes</span><span className="stat-bottom-val">342</span></div>
              <div className="stat-segment"><span className="stat-top-lbl">Puntuación</span><span className="stat-bottom-val text-gold-rating">★ 5.0</span></div>
            </div>

            <div className="calendar-subtabs-navigation">
              <button onClick={() => setSubTabCalendario('Horarios')} className={`calendar-subtab-item ${subTabCalendario === 'Horarios' ? 'active' : ''}`}><CalendarIcon className="w-3.5 h-3.5" /> Horario disponible</button>
              <button onClick={() => setSubTabCalendario('Fechas')} className={`calendar-subtab-item ${subTabCalendario === 'Fechas' ? 'active' : ''}`}><CalendarDays className="w-3.5 h-3.5" /> Fechas importantes</button>
            </div>

            <div className="calendar-day-modifier-box">
              <p className="modifier-selected-day-title">Día seleccionado: <strong>{selectedDay ? selectedDay : 'Ninguno (Toca un día abajo)'}</strong></p>
              
              {subTabCalendario === 'Horarios' ? (
                <div className="modifier-inputs-row">
                  <input type="text" value={inputHoraInicio} onChange={(e) => setInputHoraInicio(e.target.value)} placeholder="12:00 Pm" className="modifier-input" />
                  <span>a</span>
                  <input type="text" value={inputHoraFin} onChange={(e) => setInputHoraFin(e.target.value)} placeholder="3:00 Pm" className="modifier-input" />
                  <button onClick={guardarConfiguracionDia} className="modifier-save-btn"><Check className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="modifier-inputs-row">
                  <input type="text" value={inputFechaEspecialTexto} onChange={(e) => setInputFechaEspecialTexto(e.target.value)} placeholder="Ej. Navidad (Cerrado)" className="modifier-input flex-1" />
                  <button onClick={guardarConfiguracionDia} className="modifier-save-btn"><Check className="w-3.5 h-3.5" /></button>
                </div>
              )}

              <div className="current-day-settings-list">
                {selectedDay && horariosBarberos[selectedDay] && (
                  <div className="setting-pill green-pill">Horario: {horariosBarberos[selectedDay]} <Trash2 className="w-3 h-3 cursor-pointer ml-1" onClick={() => eliminarConfiguracionDia(selectedDay, 'horario')} /></div>
                )}
                {selectedDay && fechasImportantes[selectedDay] && (
                  <div className="setting-pill red-pill">Evento: {fechasImportantes[selectedDay]} <Trash2 className="w-3 h-3 cursor-pointer ml-1" onClick={() => eliminarConfiguracionDia(selectedDay, 'fecha')} /></div>
                )}
              </div>
            </div>

            <div className="calendar-month-selector">
              <button onClick={() => cambiarMes(-1)} className="calendar-arrow-btn"><ChevronLeft className="w-4 h-4" /></button>
              <span className="calendar-month-title">{currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
              <button onClick={() => cambiarMes(1)} className="calendar-arrow-btn"><ChevronRight className="w-4 h-4" /></button>
            </div>

            <div className="calendar-weekdays-grid">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="calendar-days-mesh">{renderCalendarDays()}</div>
          </div>

        </div>
      </div>
    </div>
  );
}
