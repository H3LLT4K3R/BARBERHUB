// Catálogo curado de Estado > Ciudad > Zona para el registro de barberías y el
// filtro de Explorar. No es exhaustivo a propósito: solo cubre los estados y
// ciudades más relevantes para empezar; se puede ampliar aquí sin tocar la BD.
export const UBICACIONES = {
  "Puebla": {
    "Puebla": ["Centro", "Angelópolis", "La Paz", "Cholula"],
    "Tehuacán": ["Centro", "La Huerta"],
  },
  "Ciudad de México": {
    "CDMX": ["Centro Histórico", "Roma Norte", "Condesa", "Polanco", "Coyoacán"],
  },
  "Estado de México": {
    "Toluca": ["Centro", "Metepec"],
    "Naucalpan": ["Centro", "Satélite"],
  },
  "Jalisco": {
    "Guadalajara": ["Centro", "Providencia", "Chapultepec"],
    "Zapopan": ["Centro", "Andares"],
  },
  "Nuevo León": {
    "Monterrey": ["Centro", "San Pedro Garza García", "Cumbres"],
  },
  "Veracruz": {
    "Veracruz": ["Centro", "Boca del Río"],
    "Xalapa": ["Centro"],
  },
  "Querétaro": {
    "Querétaro": ["Centro", "Juriquilla"],
  },
  "Guanajuato": {
    "León": ["Centro", "Del Valle"],
    "Guanajuato": ["Centro"],
  },
  "Baja California": {
    "Tijuana": ["Centro", "Zona Río"],
  },
  "Yucatán": {
    "Mérida": ["Centro", "Norte"],
  },
};

export const ESTADOS = Object.keys(UBICACIONES);

export function ciudadesDe(estado) {
  return estado ? Object.keys(UBICACIONES[estado] ?? {}) : [];
}

export function zonasDe(estado, ciudad) {
  return estado && ciudad ? UBICACIONES[estado]?.[ciudad] ?? [] : [];
}
