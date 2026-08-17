/**
 * Catálogo de barberías (datos de prueba).
 * Para mostrar estos datos en OpenStreetMap se usan las coordenadas lat y lng.
 */

export const BARBERIAS = [
  {
    id: "urban-cuts",
    nombre: "Urban Cuts",
    direccion: "Blvd, 5 de mayo, Puebla",
    rating: 5.0,
    totalOpiniones: 729,
    abierto: true,
    lat: 19.0414,
    lng: -98.2063,
    imagen: "/barberhublogo.jpg",
    servicioDefault: "Corte y Barba",
    precioEstimado: 350,
    moneda: "MXN",
    slotInicio: 9,
    slotFin: 16,
    slotIntervalo: 30,
    citasOcupadas: {
      "2026-05-21": [
        "09:30", "10:00", "10:30", "12:00", "13:00",
        "13:30", "14:00", "14:30", "15:30",
      ],
      "2026-05-22": ["09:00", "09:30", "11:00", "12:30", "15:00"],
      "2026-05-23": ["10:00", "10:30", "11:30", "14:00", "16:00"],
    },
    servicios: [
      { id: "barba-premium", nombre: "Barba premium", precio: 270, icono: "moustache" },
      { id: "afeitado", nombre: "Afeitado clásico", precio: 250, icono: "razor" },
      { id: "facial", nombre: "Facial masculino", precio: 400, icono: "user" },
      { id: "corte", nombre: "Cortes de pelo", precio: 150, icono: "scissors" },
    ],
    serviciosExtendidos: [
      { id: "barba-premium", nombre: "Barba premium", precio: 270, icono: "moustache" },
      { id: "afeitado", nombre: "Afeitado clásico", precio: 250, icono: "razor" },
      { id: "facial", nombre: "Facial masculino", precio: 400, icono: "user" },
      { id: "corte", nombre: "Cortes de pelo", precio: 150, icono: "scissors" },
      { id: "combo", nombre: "Corte y Barba", precio: 330, icono: "razor" },
      { id: "fade", nombre: "Fade degradado", precio: 350, icono: "scissors" },
      { id: "perfilado", nombre: "Perfilado", precio: 190, icono: "moustache" },
      { id: "rasurado-cabeza", nombre: "Rasurado de cabeza", precio: 300, icono: "razor" },
      { id: "tintura", nombre: "Tintura de cabello", precio: 550, icono: "user" },
    ],
    barberos: [
      { id: "alexis", nombre: "Alexis Duran", rating: 4.2, opiniones: 120, foto: "https://i.pravatar.cc/120?u=alexis-duran" },
      { id: "carlos", nombre: "Carlos Ruiz", rating: 4.8, opiniones: 89, foto: "https://i.pravatar.cc/120?u=carlos-ruiz" },
      { id: "miguel", nombre: "Miguel Torres", rating: 4.5, opiniones: 64, foto: "https://i.pravatar.cc/120?u=miguel-torres" },
    ],
    opiniones: [
      "Muy buen servicio y los barberos ni hablar, excelentes en su trabajo.",
      "El mejor fade que me han hecho. Volveré sin duda.",
      "Ambiente limpio, puntualidad y trato amable. Recomendado.",
      "Precios justos y resultados profesionales. Urban Cuts es mi favorita.",
    ],
  },
  {
    id: "classic-blade",
    nombre: "Classic Blade",
    direccion: "Av. Juárez 120, Centro, Puebla",
    rating: 4.7,
    totalOpiniones: 412,
    abierto: true,
    lat: 19.0437,
    lng: -98.1982,
    imagen: "/barberhublogo.jpg",
    servicioDefault: "Corte clásico",
    precioEstimado: 280,
    moneda: "MXN",
    slotInicio: 10,
    slotFin: 19,
    slotIntervalo: 30,
    citasOcupadas: {
      "2026-05-21": ["10:00", "11:30", "14:00"],
    },
    servicios: [
      { id: "corte", nombre: "Corte clásico", precio: 180, icono: "scissors" },
      { id: "barba", nombre: "Perfilado de barba", precio: 220, icono: "moustache" },
    ],
    serviciosExtendidos: [
      { id: "corte", nombre: "Corte clásico", precio: 180, icono: "scissors" },
      { id: "barba", nombre: "Perfilado de barba", precio: 220, icono: "moustache" },
      { id: "afeitado", nombre: "Afeitado tradicional", precio: 260, icono: "razor" },
    ],
    barberos: [
      { id: "jorge", nombre: "Jorge Vega", rating: 4.6, opiniones: 95, foto: "https://i.pravatar.cc/120?u=jorge-vega" },
    ],
    opiniones: [
      "Excelente atención y muy buen ambiente.",
      "Siempre salgo satisfecho con el corte.",
    ],
  },
  {
    id: "corte-central",
    nombre: "Corte Central",
    direccion: "Av. Reforma 245, La Paz, Puebla",
    rating: 4.9,
    totalOpiniones: 318,
    abierto: true,
    lat: 19.0486,
    lng: -98.2118,
    imagen: "/barberhublogo.jpg",
    servicioDefault: "Corte contemporáneo",
    precioEstimado: 320,
    moneda: "MXN",
    slotInicio: 9,
    slotFin: 18,
    slotIntervalo: 30,
    citasOcupadas: {},
    servicios: [
      { id: "fade", nombre: "Degradado / Fade", precio: 200, icono: "scissors" },
      { id: "combo", nombre: "Corte + barba", precio: 320, icono: "razor" },
    ],
    serviciosExtendidos: [
      { id: "fade", nombre: "Degradado / Fade", precio: 200, icono: "scissors" },
      { id: "combo", nombre: "Corte + barba", precio: 320, icono: "razor" },
      { id: "perfilado", nombre: "Perfilado", precio: 180, icono: "moustache" },
    ],
    barberos: [
      { id: "luis", nombre: "Luis Hernández", rating: 4.9, opiniones: 210, foto: "https://i.pravatar.cc/120?u=luis-hernandez" },
    ],
    opiniones: [
      "Los mejores fades de la zona.",
    ],
  },
  {
    id: "navaja-dorada",
    nombre: "Navaja Dorada",
    direccion: "Calle 7 Sur 810, El Carmen, Puebla",
    rating: 4.6,
    totalOpiniones: 186,
    abierto: true,
    lat: 19.0386,
    lng: -98.1954,
    imagen: "/barberhublogo.jpg",
    servicioDefault: "Corte y perfilado de barba",
    precioEstimado: 300,
    moneda: "MXN",
    slotInicio: 10,
    slotFin: 19,
    slotIntervalo: 30,
    citasOcupadas: {},
    servicios: [
      { id: "corte", nombre: "Corte personalizado", precio: 190, icono: "scissors" },
      { id: "barba", nombre: "Perfilado de barba", precio: 210, icono: "moustache" },
    ],
    serviciosExtendidos: [
      { id: "corte", nombre: "Corte personalizado", precio: 190, icono: "scissors" },
      { id: "barba", nombre: "Perfilado de barba", precio: 210, icono: "moustache" },
      { id: "afeitado", nombre: "Afeitado tradicional", precio: 250, icono: "razor" },
    ],
    barberos: [
      { id: "dario", nombre: "Darío Morales", rating: 4.7, opiniones: 108, foto: "https://i.pravatar.cc/120?u=dario-morales" },
    ],
    opiniones: ["Buen ambiente y atención muy cuidadosa."],
  },
];

export function getBarberiaById(id) {
  return BARBERIAS.find((b) => b.id === id) ?? BARBERIAS[0];
}

/** Compatibilidad con flujo de agenda en local */
export const BARBERIA_DEMO = getBarberiaById("urban-cuts");
