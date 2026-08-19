import { supabase } from "../lib/supabase.js";

const TOKEN_KEY = "barberhub_token";
const USER_KEY = "barberhub_user";

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("token_sesion");
  await supabase.auth.signOut();
}

export async function apiFetch(path, options = {}) {
  // Siempre se toma el token vigente de la sesión de Supabase (que se renueva sola
  // en segundo plano), en vez de una copia fija en localStorage que se queda vieja
  // y provoca "sesión expirada" aunque el usuario siga logueado.
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    // fetch() rechaza (en vez de resolver con una respuesta) cuando no hay conexión
    // o el backend está inalcanzable. Sin este catch, algunas pantallas mostraban el
    // texto crudo del navegador ("Failed to fetch") en vez de un mensaje entendible.
    const error = new Error("No fue posible conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
    error.status = 0;
    throw error;
  }
  let data;
  let huboRespuestaNoJson = false;

  try {
    data = await res.json();
  } catch {
    // El backend siempre responde JSON; si esto falla es porque quien contestó fue
    // el proxy/CDN en el medio (una página de error HTML), típicamente porque el
    // backend está caído o inalcanzable, no porque la solicitud en sí esté mal.
    data = {};
    huboRespuestaNoJson = true;
  }

  if (!res.ok) {
    const mensajePorDefecto = huboRespuestaNoJson && res.status >= 500
      ? "El servidor no está disponible en este momento. Intenta de nuevo en unos minutos."
      : "Error en la solicitud.";
    const error = new Error(data.error || mensajePorDefecto);
    error.status = res.status;
    error.code = data.code;
    throw error;
  }

  return data;
}
