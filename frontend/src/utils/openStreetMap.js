/** Abre la ubicación en el sitio de OpenStreetMap. */
export function getOpenStreetMapUrl(latitude, longitude, zoom = 16) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'https://www.openstreetmap.org';

  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}
