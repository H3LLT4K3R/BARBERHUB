-- Corrección de diseño: la versión anterior de has_module_access entraba a "modo
-- estricto" para TODA la persona en cuanto existía UNA fila de permiso suya (en
-- cualquier módulo), bloqueando de golpe todos los módulos sin fila explícita. Eso
-- no es lo que se pidió: cada módulo debe ser independiente. Mientras el dueño no
-- toque el switch de un módulo específico, ese módulo sigue abierto — sin importar
-- si ya tocó el switch de OTRO módulo para esa misma persona. Un switch en Seguridad
-- solo bloquea el módulo al que pertenece, nunca de refilón a los demás.
create or replace function public.has_module_access(
  p_barberia_id uuid,
  p_module_code text,
  p_need_manage boolean default false,
  p_profile_id uuid default auth.uid()
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_membership_id uuid;
  v_role public.membership_role;
  v_can_view boolean;
  v_can_manage boolean;
begin
  select id, role into v_membership_id, v_role
  from public.barberia_memberships
  where barberia_id = p_barberia_id and profile_id = p_profile_id and is_active
  limit 1;

  if v_membership_id is null then
    return false; -- no es miembro activo de esta barbería
  end if;
  if v_role = 'owner' then
    return true;
  end if;

  select mp.can_view, mp.can_manage into v_can_view, v_can_manage
  from public.membership_module_permissions mp
  join public.platform_modules pm on pm.id = mp.module_id
  where mp.membership_id = v_membership_id and pm.code = p_module_code;

  if not found then
    return true; -- sin fila para ESTE módulo: abierto por defecto
  end if;
  if p_need_manage then
    return coalesce(v_can_manage, true);
  end if;
  return coalesce(v_can_view, true);
end;
$$;
