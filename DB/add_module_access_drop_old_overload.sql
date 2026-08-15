-- Bug encontrado al volver a probar en vivo: create or replace function no reemplaza
-- una función si cambia la cantidad de parámetros — solo agrega una versión más
-- (overload). La primera migración creó has_module_access(uuid, text, boolean); las
-- siguientes agregaron has_module_access(uuid, text, boolean, uuid) sin nunca borrar
-- la original de 3 parámetros. Quedaron las dos a la vez, y cuando las políticas RLS
-- la llamaban con solo 3 argumentos, Postgres no podía decidir cuál de las dos usar
-- (error PGRST203, "Could not choose the best candidate function") — eso es lo que
-- bloqueaba inventario aunque no tuviera ninguna fila de permiso.
--
-- Las políticas ya creadas quedaron ligadas a la función vieja de 3 parámetros (la
-- que existía cuando se crearon), así que no se puede borrar esa función sin antes
-- quitarles esa dependencia: se borran, se borra la función vieja, y se vuelven a
-- crear idénticas — ahora solo existe la de 4 parámetros, sin ambigüedad posible.

drop policy if exists categories_manage on public.service_categories;
drop policy if exists services_manage on public.services;
drop policy if exists staff_services_manage on public.staff_services;
drop policy if exists coupons_manage on public.coupons;
drop policy if exists suppliers_staff on public.suppliers;
drop policy if exists inventory_staff on public.inventory_items;
drop policy if exists inventory_movements_staff_read on public.inventory_movements;
drop policy if exists financial_transactions_staff_read on public.financial_transactions;
drop policy if exists business_hours_manage on public.business_hours;
drop policy if exists staff_availability_manage on public.staff_availability;
drop policy if exists exceptions_manage on public.availability_exceptions;

drop function if exists public.has_module_access(uuid, text, boolean);

-- catálogo
create policy categories_manage on public.service_categories for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'catalogo',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'catalogo',true));

create policy services_manage on public.services for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'catalogo',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'catalogo',true));

create policy staff_services_manage on public.staff_services for all to authenticated
  using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(m.barberia_id,'catalogo',true)))
  with check(exists(select 1 from public.barberia_memberships m where m.id = membership_id and public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(m.barberia_id,'catalogo',true)));

-- cupones
create policy coupons_manage on public.coupons for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'cupones',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'cupones',true));

-- inventario
create policy suppliers_staff on public.suppliers for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'inventario',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'inventario',true));

create policy inventory_staff on public.inventory_items for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'inventario',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'inventario',true));

create policy inventory_movements_staff_read on public.inventory_movements for select to authenticated
  using(exists(select 1 from public.inventory_items i where i.id = inventory_item_id and public.is_member(i.barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(i.barberia_id,'inventario',false)));

-- finanzas
create policy financial_transactions_staff_read on public.financial_transactions for select to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'finanzas',false));

-- agenda
create policy business_hours_manage on public.business_hours for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'agenda',true))
  with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]) and public.has_module_access(barberia_id,'agenda',true));

create policy staff_availability_manage on public.staff_availability for all to authenticated
  using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and (m.profile_id = auth.uid() or public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[])) and public.has_module_access(m.barberia_id,'agenda',true)))
  with check(exists(select 1 from public.barberia_memberships m where m.id = membership_id and (m.profile_id = auth.uid() or public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[])) and public.has_module_access(m.barberia_id,'agenda',true)));

create policy exceptions_manage on public.availability_exceptions for all to authenticated
  using(public.is_member(barberia_id,array['owner','admin','barber']::public.membership_role[]) and public.has_module_access(barberia_id,'agenda',true))
  with check(public.is_member(barberia_id,array['owner','admin','barber']::public.membership_role[]) and public.has_module_access(barberia_id,'agenda',true));
