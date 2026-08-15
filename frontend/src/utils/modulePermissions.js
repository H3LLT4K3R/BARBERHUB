import { supabase } from "../lib/supabase.js";

// Misma regla que public.has_module_access en la base de datos (ver
// DB/add_module_access_per_module_default_open.sql): el dueño nunca se restringe a
// sí mismo; cada módulo es independiente y está abierto por defecto; solo queda
// bloqueado si existe una fila con can_view = false para ESE módulo específico.
// Devuelve el Set de codes de módulos BLOQUEADOS (vacío si no hay ninguno).
export async function obtenerModulosBloqueados(membershipId, role) {
  if (role === "owner") return new Set();

  const { data: permisos } = await supabase
    .from("membership_module_permissions")
    .select("can_view, platform_modules(code)")
    .eq("membership_id", membershipId)
    .eq("can_view", false);

  return new Set((permisos ?? []).map((p) => p.platform_modules?.code).filter(Boolean));
}
