-- CRÍTICO: cualquier usuario autenticado podía autoasignarse super administrador.
--
-- La policy "profiles_self" permite a cada quien actualizar SU PROPIA fila (correcto:
-- así edita su nombre/teléfono desde Ajustes), pero RLS solo controla QUÉ FILA se puede
-- tocar, no QUÉ COLUMNAS. Nada impedía que alguien, desde la consola del navegador,
-- hiciera:
--   supabase.from('profiles').update({ is_super_admin: true }).eq('id', suPropioId)
-- y ganara acceso total al panel de super administrador. Se confirmó en vivo con una
-- cuenta de prueba antes de este fix.
--
-- Nota: barberia_memberships ya tenía este mismo riesgo resuelto a propósito (ver el
-- comentario en perfilController.js) al no darle política de auto-actualización directa
-- y forzar los cambios de "role" a pasar por el backend. Este fix aplica la misma idea
-- a "profiles", pero con un trigger en vez de quitar la policy por completo (para no
-- romper la edición de nombre/teléfono desde Ajustes).
--
-- El trigger deja pasar sin tocar cualquier cambio que venga del backend (que usa la
-- llave de servicio, auth.role() = 'service_role'); si el cambio viene de un usuario
-- normal, is_super_admin e is_active se restauran a su valor anterior sin importar qué
-- haya mandado la petición.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.is_super_admin := old.is_super_admin;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();
