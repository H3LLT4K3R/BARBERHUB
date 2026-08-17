import { supabase } from "../../../lib/supabase.js";

// Los 32 estados de México son fijos (no se dan de alta desde el panel, solo
// ciudades/zonas dentro de ellos). Ciudades y zonas ya no viven aquí como objeto fijo:
// se cargan de las tablas public.ciudades / public.zonas (ver DB/add_ciudades_zonas.sql),
// para que el super admin pueda seguir ampliándolas desde su panel sin necesitar un
// despliegue de código.
export const ESTADOS = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

let cache = null;
let cargaPromesa = null;

async function cargarUbicaciones() {
  if (cache) return cache;
  if (!cargaPromesa) {
    cargaPromesa = (async () => {
      const [{ data: ciudades }, { data: zonas }] = await Promise.all([
        supabase.from("ciudades").select("id, estado, ciudad, lat, lng").order("ciudad"),
        supabase.from("zonas").select("id, ciudad_id, zona").order("zona"),
      ]);

      const ciudadesPorEstado = {};
      const idPorEstadoCiudad = {};
      const coordsPorEstadoCiudad = {};
      for (const c of ciudades ?? []) {
        (ciudadesPorEstado[c.estado] ??= []).push(c.ciudad);
        idPorEstadoCiudad[`${c.estado}|${c.ciudad}`] = c.id;
        if (c.lat != null && c.lng != null) {
          coordsPorEstadoCiudad[`${c.estado}|${c.ciudad}`] = { lat: c.lat, lng: c.lng };
        }
      }

      const zonasPorCiudadId = {};
      for (const z of zonas ?? []) {
        (zonasPorCiudadId[z.ciudad_id] ??= []).push(z.zona);
      }

      cache = { ciudadesPorEstado, idPorEstadoCiudad, zonasPorCiudadId, coordsPorEstadoCiudad };
      return cache;
    })();
  }
  return cargaPromesa;
}

// Se llama después de agregar una ciudad/zona nueva desde el panel de super admin,
// para que el resto de la app (Explorar, alta de barberías) las vea sin recargar.
export function invalidarCacheUbicaciones() {
  cache = null;
  cargaPromesa = null;
}

export async function ciudadesDe(estado) {
  if (!estado) return [];
  const { ciudadesPorEstado } = await cargarUbicaciones();
  return ciudadesPorEstado[estado] ?? [];
}

export async function zonasDe(estado, ciudad) {
  if (!estado || !ciudad) return [];
  const { idPorEstadoCiudad, zonasPorCiudadId } = await cargarUbicaciones();
  const ciudadId = idPorEstadoCiudad[`${estado}|${ciudad}`];
  return ciudadId ? zonasPorCiudadId[ciudadId] ?? [] : [];
}

// Coordenadas de la ciudad, para centrar el mapa de Explorar en ella aunque todavía
// no tenga ninguna barbería. Devuelve null si la ciudad no se pudo geocodificar.
export async function coordenadasDe(estado, ciudad) {
  if (!estado || !ciudad) return null;
  const { coordsPorEstadoCiudad } = await cargarUbicaciones();
  return coordsPorEstadoCiudad[`${estado}|${ciudad}`] ?? null;
}
