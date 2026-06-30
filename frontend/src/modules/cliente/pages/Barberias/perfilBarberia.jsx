import React, { useState, useRef } from 'react';
import CrearCupon from './crearCupon';

import { 
  User, MapPin, MessageSquare, Share2, Heart, 
  Plus, Trash2, Upload, Scissors, Edit2, Check, 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight,
  LogOut, LayoutDashboard, Menu, X, CalendarDays
} from 'lucide-react';
import "../../styles/Barberias/perfilbarberia.css";

export default function PerfilBarberiaFinal() {
  const [activeTab, setActiveTab] = useState('Acerca');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Estado para el logo interactivo del Header
  const [logoImage, setLogoImage] = useState(null); 

  // NUEVO: Estado para que el nombre de la barbería sea completamente modificable
  const [nombreBarberia, setNombreBarberia] = useState('Mathew McCoy - Barberia profesional');

  // Estados de la tarjeta de perfil
  const [avatarImage, setAvatarImage] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [chatActive, setChatActive] = useState(false);

  // Ubicación dinámica (Sincronizada automáticamente en ambas secciones)
  const [ubicacion, setUbicacion] = useState('950 W Mesquite Blvd, Mesquite, NV 89027, Estados Unidos');
  const [horarioSemana, setHorarioSemana] = useState('09.00 am - 08.00 pm');
  const [horarioFinde, setHorarioFinde] = useState('09.00 am - 09.00 pm');
  const [isEditingHours, setIsEditingHours] = useState(false);

  // Gestión de Servicios
  const [serviciosList, setServiciosList] = useState([
    { id: 1, nombre: 'Corte Clásico', precio: '$25.00' },
    { id: 2, nombre: 'Arreglo de Barba', precio: '$15.00' }
  ]);
  const [nuevoServicioNombre, setNuevoServicioNombre] = useState('');
  const [nuevoServicioPrecio, setNuevoServicioPrecio] = useState('');

  const agregarNuevoServicio = () => {
    if (!nuevoServicioNombre || !nuevoServicioPrecio) return;
    const nuevo = {
      id: Date.now(),
      nombre: nuevoServicioNombre,
      precio: nuevoServicioPrecio.startsWith('$') ? nuevoServicioPrecio : `$${nuevoServicioPrecio}`
    };
    setServiciosList([...serviciosList, nuevo]);
    setNuevoServicioNombre('');
    setNuevoServicioPrecio('');
  };

  const eliminarServicio = (id) => {
    setServiciosList(serviciosList.filter(s => s.id !== id));
  };

  // Habilidades
  const [skillsImages, setSkillsImages] = useState({
    0: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80',
    1: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80',
    2: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80',
    3: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80',
  });

  // Gestión del Calendario
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

  const guardarConfiguracionDia = () => {
    if (!selectedDay) {
      alert("Por favor selecciona un día del calendario primero.");
      return;
    }
    if (subTabCalendario === 'Horarios') {
      setHorariosBarberos({
        ...horariosBarberos,
        [selectedDay]: `${inputHoraInicio} - ${inputHoraFin}`
      });
    } else {
      if (!inputFechaEspecialTexto) return;
      setFechasImportantes({
        ...fechasImportantes,
        [selectedDay]: inputFechaEspecialTexto
      });
      setInputFechaEspecialTexto('');
    }
  };

  const eliminarConfiguracionDia = (fecha, tipo) => {
    if (tipo === 'horario') {
      const copia = { ...horariosBarberos };
      delete copia[fecha];
      setHorariosBarberos(copia);
    } else {
      const copia = { ...fechasImportantes };
      delete copia[fecha];
      setFechasImportantes(copia);
    }
  };

  const handleCompartir = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('¡Enlace de la barbería copiado al portapapeles!');
  };

  const fileInputRefs = useRef([]);
  const avatarInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSkillImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSkillsImages(prev => ({ ...prev, [index]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const dayElements = [];
    
    for (let i = 0; i < firstDayIndex; i++) {
      dayElements.push(<div key={`empty-${i}`} className="calendar-day-cell empty"></div>);
    }
    
    for (let day = 1; day <= totalDays; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasHorario = horariosBarberos[dateString];
      const hasImportant = fechasImportantes[dateString];
      const isSelected = selectedDay === dateString;
      
      dayElements.push(
        <div 
          key={day} 
          className={`calendar-day-cell ${isSelected ? 'selected' : ''} ${hasImportant ? 'day-important' : ''} ${hasHorario && !hasImportant ? 'day-has-hours' : ''}`}
          onClick={() => {
            setSelectedDay(dateString);
            if (horariosBarberos[dateString]) {
              const [inicio, fin] = horariosBarberos[dateString].split(' - ');
              setInputHoraInicio(inicio || '12:00 Pm');
              setInputHoraFin(fin || '3:00 Pm');
            }
            if (fechasImportantes[dateString]) {
              setInputFechaEspecialTexto(fechasImportantes[dateString]);
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

  // Función interna para acortar la dirección en el badge azul (ej: extraer la ciudad)
  const obtenerCiudadBreve = (direccionLarga) => {
    if (!direccionLarga) return 'Sin localización';
    const partes = direccionLarga.split(',');
    if (partes.length >= 2) {
      return `${partes[1].trim()}`;
    }
    return direccionLarga;
  };

  return (
    <div className="app-global-container">
      
      {/* HEADER SUPERIOR CON LOGO */}
      <header className="app-top-black-header">
        <button className="mobile-menu-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        <div className="header-brand-area" onClick={() => logoInputRef.current.click()}>
          <input type="file" ref={logoInputRef} onChange={handleLogoChange} className="hidden-file-input" accept="image/*" />
          <div className="header-logo-circle-wrapper">
            {logoImage ? (
              <img src={logoImage} alt="Logo Barberia" className="header-custom-logo-img" />
            ) : (
              <div className="header-logo-placeholder-green"></div>
            )}
          </div>
          <span className="header-brand-text">BARBER HUB</span>
        </div>
      </header>

      <div className="app-layout-wrapper">
        {isSidebarOpen && <div className="sidebar-mobile-blur-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

       {/* BARRA LATERAL */}
<aside className={`main-sidebar-black ${isSidebarOpen ? 'is-open' : ''}`}>
  <div className="sidebar-top-container">
    <div className="sidebar-navigation-links">
      
      {/* Botón Perfil Barbería */}
      <button 
        className="sidebar-gold-pill-btn" 
        onClick={() => {
          navigate("/perfilBarberia");
              setIsSidebarOpen(false);
        }}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Perfil Barbería</span>
      </button>

      {/* Botón Crear Cupón */}
      <button 
        className="sidebar-gold-pill-btn" 
        onClick={() => {
          navigate("/crearCupon");
          setIsSidebarOpen(false);
        }}
      >
        <CalendarDays className="w-4 h-4" />
        <span>Crear Cupón</span>
      </button>

      {/* agregando más botones */}
      {/*
      <button 
        className="sidebar-gold-pill-btn" 
        onClick={() => {
          setActiveTab("inventario");
          setIsSidebarOpen(false);
        }}
      >
        <Box className="w-4 h-4" />
        <span>Inventario</span>
      </button>
      */}
    </div>
  </div>

  <div className="sidebar-lower-section">
    <button 
      onClick={() => { 
        alert('Cerrando sesión...'); 
        setIsSidebarOpen(false); 
      }} 
      className="sidebar-logout-btn"
    >
      <LogOut className="w-4 h-4" />
      <span>Cerrar sesión</span>
    </button>
  </div>
</aside>


        {/* CONTENEDOR PRINCIPAL */}
        <div className="app-main-dark-bg">
          <main className="main-content-layout">
            <div className="barber-cards-row-grid-three">
              
              {/* COLUMNA 1 */}
              <div className="layout-column">
                
                {/* TARJETA AZUL */}
                <div className="card-profile-blue">
                  <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden-file-input" accept="image/*" />
                  <div className="profile-avatar-circle interactive-avatar" onClick={() => avatarInputRef.current.click()}>
                    {avatarImage ? <img src={avatarImage} alt="Perfil" className="avatar-img-preview" /> : <User className="avatar-placeholder-icon" />}
                    <div className="avatar-hover-overlay"><Upload className="w-4 h-4 text-white" /></div>
                  </div>
                  
                  {/* MODIFICADO: Ahora el nombre es un Input estilizado editable directamente */}
                  <div className="editable-name-container">
                    <input 
                      type="text" 
                      value={nombreBarberia} 
                      onChange={(e) => setNombreBarberia(e.target.value)} 
                      className="profile-title-name-input"
                      placeholder="Nombre de la barbería..."
                    />
                  </div>

                  {/* MODIFICADO: Cambia dinámicamente según el estado "ubicacion" */}
                  <p className="profile-subtitle-geo">
                    <MapPin className="inline-geo-icon" /> {obtenerCiudadBreve(ubicacion)}
                  </p>
                  
                  <div className="profile-quick-actions">
                    <button onClick={() => setChatActive(!chatActive)} className={`quick-action-btn ${chatActive ? 'chat-active' : ''}`}>
                      <MessageSquare className="action-svg" />
                      <span>Chat</span>
                    </button>
                    
                    <button onClick={handleCompartir} className="quick-action-btn share-btn-hover">
                      <Share2 className="action-svg" />
                      <span>Share</span>
                    </button>

                    <button onClick={() => setIsSaved(!isSaved)} className={`quick-action-btn ${isSaved ? 'saved-active' : ''}`}>
                      <Heart className="action-svg" />
                      <span>{isSaved ? 'Saved!' : 'Save'}</span>
                    </button>
                  </div>
                </div>

                {/* CONTENEDOR DE LOCALIZACIÓN MEJORADO */}
                <div className="card-white-container localization-premium-card">
                  <div className="localization-header-block">
                    <div className="geo-icon-badge">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="localization-text-side">
                      <h3 className="card-section-title-modern">Localización</h3>
                      
                      {/* MODIFICADO: Input editable para que al alterar este campo, la zona azul se actualice automáticamente */}
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
                      title="Map" 
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(ubicacion)}&t=&z=14&ie=UTF8&iwloc=&output=embed`} 
                      className="osm-real-map-embed" 
                      allowFullScreen 
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>

              </div>

              {/* COLUMNA 2 */}
              <div className="card-white-container layout-column flex-between">
                <div>
                  <div className="custom-navigation-tabs">
                    <button onClick={() => setActiveTab('Acerca')} className={`nav-tab-item ${activeTab === 'Acerca' ? 'active' : ''}`}><User className="w-3 h-3" /> Acerca</button>
                    <button onClick={() => setActiveTab('Servicios')} className={`nav-tab-item ${activeTab === 'Servicios' ? 'active' : ''}`}><Scissors className="w-3 h-3" /> Servicios</button>
                  </div>

                  {activeTab === 'Acerca' && (
                    <>
                      <p className="description-paragraph-text">Somos una barberia con mucha experiencia en... <span className="read-more-purple">Leer mas...</span></p>
                      <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
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
                          <input type="text" placeholder="Nombre (ej. Corte Premium)" value={nuevoServicioNombre} onChange={(e) => setNuevoServicioNombre(e.target.value)} className="add-service-input-text" />
                          <input type="text" placeholder="Precio ($)" value={nuevoServicioPrecio} onChange={(e) => setNuevoServicioPrecio(e.target.value)} className="add-service-input-price" />
                          <button onClick={agregarNuevoServicio} className="add-service-submit-pill"><Plus className="w-4 h-4" /></button>
                        </div>
                      </div>

                      <div className="services-cards-stack">
                        {serviciosList.map(s => (
                          <div key={s.id} className="service-premium-row-card">
                            <div className="service-inputs-group-block">
                              <Scissors className="w-3.5 h-3.5 text-purple-500" />
                              <input type="text" value={s.nombre} onChange={(e) => setServiciosList(serviciosList.map(item => item.id === s.id ? {...item, nombre: e.target.value} : item))} className="premium-service-name-input" />
                              <span className="price-tag-prefix">$</span>
                              <input type="text" value={s.precio.replace('$', '')} onChange={(e) => setServiciosList(serviciosList.map(item => item.id === s.id ? {...item, precio: '$' + e.target.value} : item))} className="premium-service-price-input" />
                            </div>
                            <button onClick={() => eliminarServicio(s.id)} className="delete-service-row-btn"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button className="primary-purple-submit-btn mt-4">Guardar Cambios</button>
              </div>

              {/* COLUMNA 3 */}
              <div className="card-white-container layout-column">
                <div className="horizontal-stats-header-bar">
                  <div className="stat-segment"><span className="stat-top-lbl">Experiencia</span><span className="stat-bottom-val">5 años</span></div>
                  <div className="stat-segment border-x border-gray-100"><span className="stat-top-lbl">Clientes</span><span className="stat-bottom-val">342</span></div>
                  <div className="stat-segment"><span className="stat-top-lbl">Puntuación</span><span className="stat-bottom-val text-yellow-500">★ 5.0</span></div>
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
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="calendar-arrow-btn"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="calendar-month-title">{currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="calendar-arrow-btn"><ChevronRight className="w-4 h-4" /></button>
                </div>

                <div className="calendar-weekdays-grid">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="calendar-days-mesh">{renderCalendarDays()}</div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}