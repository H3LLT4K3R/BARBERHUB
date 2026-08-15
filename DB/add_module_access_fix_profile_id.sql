-- Bug encontrado al probar add_module_permissions_enforcement.sql en vivo: el backend
-- llama a has_module_access() con supabaseAdmin (llave de servicio), y dentro de esa
-- llamada auth.uid() no tiene ningún usuario real asociado (queda null) — así que la
-- función nunca encontraba la membresía de NADIE y negaba el acceso a todos, incluido
-- el dueño (que nunca debe restringirse). Se agrega un parámetro p_profile_id que las
-- políticas RLS siguen resolviendo solas (default auth.uid(), correcto ahí porque esas
-- consultas sí corren con el JWT real de quien pregunta), y que el backend ahora pasa
-- explícito con el id del usuario ya validado por requireUser.
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
  v_has_any boolean;
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

  select exists(
    select 1 from public.membership_module_permissions where membership_id = v_membership_id
  ) into v_has_any;
  if not v_has_any then
    return true; -- todavía no se configuró nada para esta persona: acceso completo
  end if;

  select mp.can_view, mp.can_manage into v_can_view, v_can_manage
  from public.membership_module_permissions mp
  join public.platform_modules pm on pm.id = mp.module_id
  where mp.membership_id = v_membership_id and pm.code = p_module_code;

  if not found then
    return false; -- ya está en modo estricto y este módulo no tiene fila: bloqueado
  end if;
  if p_need_manage then
    return coalesce(v_can_manage, false);
  end if;
  return coalesce(v_can_view, false);
end;
$$;
