-- La pantalla "Seguridad de la Plataforma" (owner-seguridad.jsx) deja al dueño
-- prender/apagar el acceso de sus administradores y barberos a cada módulo
-- (catálogo, cupones, finanzas, inventario, agenda, opiniones...) escribiendo en
-- membership_module_permissions. Pero nada leía esa tabla: ni las políticas RLS de
-- esas tablas, ni el backend. El switch no restringía nada de verdad.
--
-- Comportamiento acordado con el dueño del proyecto:
--   - El dueño (role = 'owner') nunca se restringe a sí mismo.
--   - Si a una persona (admin/barbero) todavía NO se le ha configurado NINGÚN
--     permiso (ninguna fila en membership_module_permissions), tiene acceso
--     completo por defecto — así ninguna cuenta existente pierde acceso de golpe
--     el día que esto se active.
--   - En cuanto exista AL MENOS una fila de permiso para esa persona, a partir de
--     ahí el sistema pasa a modo estricto para ella: cada módulo sin fila explícita
--     (o con can_view/can_manage en false) queda bloqueado.
create or replace function public.has_module_access(
  p_barberia_id uuid,
  p_module_code text,
  p_need_manage boolean default false
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
  where barberia_id = p_barberia_id and profile_id = auth.uid() and is_active
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

-- A partir de aquí solo se tocan políticas exclusivas de staff (nunca compartidas
-- con clientes/público) — se les agrega el chequeo de módulo SIN quitar la
-- restricción de rol que ya tenían, para no abrirle acceso a nadie que antes no
-- lo tuviera (ej. un barbero nunca debe poder tocar categorías/servicios/finanzas,
-- tenga o no permisos de módulo, porque ese rol nunca estuvo en la lista original).

-- catálogo
drop policy if exists categories_manage on public.service_categories;
create policy categories_manage on public.service_categories for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'catalogo',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'catalogo',true));

drop policy if exists services_manage on public.services;
create policy services_manage on public.services for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'catalogo',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'catalogo',true));

drop policy if exists staff_services_manage on public.staff_services;
create policy staff_services_manage on public.staff_services for all to authenticated
  using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(m.barberia_id,'catalogo',true)))
  with check(exists(select 1 from public.barberia_memberships m where m.id = membership_id and public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(m.barberia_id,'catalogo',true)));

-- cupones (solo la administración; coupons_read se deja intacta porque también la usan clientes)
drop policy if exists coupons_manage on public.coupons;
create policy coupons_manage on public.coupons for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'cupones',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'cupones',true));

-- inventario
drop policy if exists suppliers_staff on public.suppliers;
create policy suppliers_staff on public.suppliers for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'inventario',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'inventario',true));

drop policy if exists inventory_staff on public.inventory_items;
create policy inventory_staff on public.inventory_items for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'inventario',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'inventario',true));

drop policy if exists inventory_movements_staff_read on public.inventory_movements;
create policy inventory_movements_staff_read on public.inventory_movements for select to authenticated
  using(exists(select 1 from public.inventory_items i where i.id = inventory_item_id and public.is_member(i.barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(i.barberia_id,'inventario',false)));

-- finanzas (solo lectura por RLS; los registros los crea el backend con la llave de servicio)
drop policy if exists financial_transactions_staff_read on public.financial_transactions;
create policy financial_transactions_staff_read on public.financial_transactions for select to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'finanzas',false));

-- agenda (horarios y disponibilidad; las citas en sí las gatilla el backend, ver más abajo)
drop policy if exists business_hours_manage on public.business_hours;
create policy business_hours_manage on public.business_hours for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'agenda',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'agenda',true));

drop policy if exists staff_availability_manage on public.staff_availability;
create policy staff_availability_manage on public.staff_availability for all to authenticated
  using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and (m.profile_id = auth.uid() or public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[])) and public.has_module_access(m.barberia_id,'agenda',true)))
  with check(exists(select 1 from public.barberia_memberships m where m.id = membership_id and (m.profile_id = auth.uid() or public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[])) and public.has_module_access(m.barberia_id,'agenda',true)));

drop policy if exists exceptions_manage on public.availability_exceptions;
create policy exceptions_manage on public.availability_exceptions for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin','barber']::public.membership_role[]) and public.has_module_access(barberia_id,'agenda',true))
  with check(public.is_member(barberia_id,array['owner','admin','barber']::public.membership_role[]) and public.has_module_access(barberia_id,'agenda',true));
