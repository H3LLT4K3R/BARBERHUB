import React, { useState, useRef } from 'react';
import { User, Upload, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Star, Scissors } from 'lucide-react';
import "../../styles/Barberias/perfilbarberia.css";

export default function PerfilBarberiaBarbero() {
  const [nombreBarbero, setNombreBarbero] = useState('Mathew McCoy');
  const [avatarImage, setAvatarImage] = useState(null);
  
  const [skillsImages, setSkillsImages] = useState({
    0: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80',
    1: 'https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?auto=format&fit=crop&w=300&q=80',
  });

  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1));
  const [selectedDay, setSelectedDay] = useState(14);
  const [horariosBarbero, setHorariosBarbero] = useState({
    '14': '10:00 Am - 6:00 Pm'
  });
  const [inputHoraInicio, setInputHoraInicio] = useState('');
  const [inputHoraFin, setInputHoraFin] = useState('');

  const avatarInputRef = useRef(null);
  const fileInputRefs = useRef([]);

  const procesarArchivoImagen = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const guardarHorario = () => {
    if (!selectedDay || !inputHoraInicio || !inputHoraFin) return;
    setHorariosBarbero(prev => ({
      ...prev,
      [selectedDay]: `${inputHoraInicio} - ${inputHoraFin}`
    }));
  };

  return (
    <div className="pagina-barberia-global fade-in">
      <div className="perfil-clean-wrapper">
        <div className="barber-cards-row-grid-three">
          
          {/* COLUMNA 1: Perfil */}
          <div className="layout-column">
            <div className="card-profile-black">
              <input type="file" ref={avatarInputRef} onChange={(e) => procesarArchivoImagen(e.target.files[0], setAvatarImage)} className="hidden-file-input" accept="image/*" />
              <div className="profile-avatar-circle interactive-avatar" onClick={() => avatarInputRef.current.click()}>
                {avatarImage ? <img src={avatarImage} alt="Perfil" className="avatar-img-preview" /> : <User className="avatar-placeholder-icon" />}
                <div className="avatar-hover-overlay"><Upload className="w-4 h-4 text-white" /></div>
              </div>
              
              <div className="editable-name-container">
                <input 
                  type="text" 
                  value={nombreBarbero} 
                  onChange={(e) => setNombreBarbero(e.target.value)} 
                  className="profile-title-name-input text-center"
                />
              </div>
              <p className="profile-subtitle-geo">Barbero Especialista</p>
              
              {/* ESTADÍSTICAS CORREGIDAS CON FLEXBOX EN LÍNEA */}
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed #4b5563', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>4.9 <Star size={14} color="#D4AF37" fill="#D4AF37" /></span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Calificación</span>
                </div>
                <div style={{ width: '1px', height: '30px', backgroundColor: '#4b5563' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>184 <Scissors size={14} color="#D4AF37" /></span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>Cortes (Mes)</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: Portafolio */}
          <div className="card-white-container layout-column">
             <div style={{ borderBottom: '2px solid #f3f4f6', paddingBottom: '15px' }}>
                {/* BOTÓN PORTAFOLIO CORREGIDO (LETRAS BLANCAS) */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#111827', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}>
                  <User size={16} /> Mi Portafolio
                </div>
             </div>
             <p className="description-paragraph-text mt-4">Sube fotos de tus mejores cortes para que los clientes vean tu trabajo.</p>
             
             <div className="skills-image-display-grid mt-4">
                {["Fade Clásico", "Diseño de Barba"].map((skill, index) => (
                  <div key={index} className="skill-photo-card">
                    <input type="file" ref={el => fileInputRefs.current[index] = el} onChange={(e) => procesarArchivoImagen(e.target.files[0], (img) => setSkillsImages(p => ({...p, [index]: img})))} className="hidden-file-input" accept="image/*" />
                    <div className="skill-image-wrapper" style={{ backgroundImage: `url(${skillsImages[index]})` }}></div>
                    <div className="skill-card-footer-info">
                      <p className="skill-label-name">{skill}</p>
                      <button onClick={() => fileInputRefs.current[index].click()} className="clean-upload-trigger-btn"><Upload size={14} /> Subir foto</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* COLUMNA 3: Disponibilidad */}
          <div className="card-white-container layout-column">
            <h3 className="sub-section-title-large"><CalendarIcon size={20}/> Mi Disponibilidad</h3>
            
            <div className="calendar-day-modifier-box">
              <p className="modifier-selected-day-title">Día seleccionado: <strong>{selectedDay ? `${selectedDay} de Noviembre` : 'Selecciona un día'}</strong></p>
              <div className="modifier-inputs-row">
                <input type="text" value={inputHoraInicio} onChange={(e) => setInputHoraInicio(e.target.value)} placeholder="Ej. 10:00 Am" className="modifier-input" />
                <span style={{color: '#6b7280'}}>a</span>
                <input type="text" value={inputHoraFin} onChange={(e) => setInputHoraFin(e.target.value)} placeholder="Ej. 6:00 Pm" className="modifier-input" />
                <button onClick={guardarHorario} className="modifier-save-btn"><Check size={16} /></button>
              </div>
              {selectedDay && horariosBarbero[selectedDay] && (
                <div className="setting-pill green-pill">Horario: {horariosBarbero[selectedDay]}</div>
              )}
            </div>

            {/* CABECERA DEL MES CORREGIDA (LETRAS BLANCAS) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', borderRadius: '10px', padding: '12px 15px', marginBottom: '15px' }}>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}><ChevronLeft size={18} /></button>
              <span style={{ fontWeight: 'bold', color: 'white', fontSize: '14px', letterSpacing: '1px' }}>{currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
              <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}><ChevronRight size={18} /></button>
            </div>
            
            {/* MALLA DEL CALENDARIO CORREGIDA CON GRID EN LÍNEA */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                <div key={i} style={{ fontSize: '12px', fontWeight: 'bold', color: '#9ca3af', marginBottom: '5px' }}>{d}</div>
              ))}
              {Array.from({length: 30}).map((_, i) => {
                const isSelected = selectedDay === i + 1;
                return (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDay(i + 1)}
                    style={{
                      padding: '10px 0',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #D4AF37' : '1px solid #e5e7eb',
                      backgroundColor: isSelected ? '#D4AF37' : '#f9fafb',
                      color: isSelected ? 'white' : '#374151',
                      transition: 'all 0.2s'
                    }}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}