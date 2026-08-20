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
  } catch (netErr) {
    throw new Error("No se pudo conectar con el servidor. Verifica tu conexión a internet.");
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 504) {
      if (!options._isRetry) {
        await new Promise((resolve) => setTimeout(resolve, 3500));
        return apiFetch(path, { ...options, _isRetry: true });
      }
      throw new Error("El servidor se está iniciando (despertando de inactividad). Por favor, intenta de nuevo en unos segundos.");
    }
    const error = new Error(data.error || "Error en la solicitud.");
    error.status = res.status;
    error.code = data.code;
    throw error;
  }

  return data;
}
