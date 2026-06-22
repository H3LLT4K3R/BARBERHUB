import { useState, useEffect } from 'react';

function App() {
  const [datos, setDatos] = useState('');

  useEffect(() => {
    // Llamada a la API que creaste en el backend
    fetch('http://localhost:3000/api/estado')
      .then(respuesta => respuesta.json())
      .then(data => setDatos(data.mensaje))
      .catch(error => console.error('Error de conexión:', error));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Panel del Frontend</h1>
      <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Respuesta del Backend:</h3>
        <p style={{ color: 'green', fontWeight: 'bold' }}>
          {datos ? datos : 'Cargando...'}
        </p>
      </div>
    </div>
  );
}

export default App;