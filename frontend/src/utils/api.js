import { supabase } from "../lib/supabase.js";

const TOKEN_KEY = "barberhub_token";
const USER_KEY = "barberhub_user";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

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

  const res = await fetch(`/api${path}`, { ...options, headers });
  let data;

  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const error = new Error(data.error || "Error en la solicitud.");
    error.status = res.status;
    error.code = data.code;
    throw error;
  }

  return data;
}
