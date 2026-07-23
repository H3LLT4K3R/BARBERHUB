const WORLD_WIDTH = 360;

/**
 * Construye una URL embebible de OpenStreetMap con un marcador en las coordenadas.
 * No requiere clave ni utiliza servicios de Google.
 */
export function getOpenStreetMapEmbedUrl(latitude, longitude, zoom = 14) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';

  // El área visible se ajusta al zoom para que el mapa conserve un encuadre útil.
  const longitudeSpan = WORLD_WIDTH / 2 ** Math.max(0, zoom - 1);
  const latitudeSpan = longitudeSpan * 0.55;
  const minLng = Math.max(-180, lng - longitudeSpan / 2);
  const maxLng = Math.min(180, lng + longitudeSpan / 2);
  const minLat = Math.max(-90, lat - latitudeSpan / 2);
  const maxLat = Math.min(90, lat + latitudeSpan / 2);
  const bbox = [minLng, minLat, maxLng, maxLat].map((value) => value.toFixed(6)).join(',');

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
}

/** Abre la ubicación en el sitio de OpenStreetMap. */
export function getOpenStreetMapUrl(latitude, longitude, zoom = 16) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'https://www.openstreetmap.org';

  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}
