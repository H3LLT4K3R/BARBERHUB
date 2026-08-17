-- 1) Los horarios de atención (business_hours) ahora solo los puede editar el owner,
--    no el admin (antes la policy permitía a ambos). El SELECT sigue siendo público.
drop policy if exists business_hours_manage on public.business_hours;
create policy business_hours_manage on public.business_hours for all to authenticated
  using(public.owns_barberia(barberia_id))
  with check(public.owns_barberia(barberia_id));

-- 2) Cuando el owner cambia el horario general de la barbería, se refleja en el horario
--    individual de sus barberos activos (equipoController.js ya hacía esto una sola vez
--    al dar de alta a un barbero nuevo; ahora también corre cada vez que el horario
--    general cambia, para que los barberos existentes lo vean actualizado en su propio
--    Perfil Barbero).
create or replace function public.sync_business_hours_to_barbers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_closed then
    delete from public.staff_availability sa
    using public.barberia_memberships m
    where sa.membership_id = m.id
      and m.barberia_id = new.barberia_id
      and m.role = 'barber'
      and m.is_active
      and sa.weekday = new.weekday;
  else
    insert into public.staff_availability (membership_id, weekday, starts_at, ends_at)
    select m.id, new.weekday, new.opens_at, new.closes_at
    from public.barberia_memberships m
    where m.barberia_id = new.barberia_id
      and m.role = 'barber'
      and m.is_active
    on conflict (membership_id, weekday) do update
      set starts_at = excluded.starts_at, ends_at = excluded.ends_at;
  end if;
  return new;
end;
$$;

drop trigger if exists business_hours_sync_barbers on public.business_hours;
create trigger business_hours_sync_barbers
after insert or update on public.business_hours
for each row execute function public.sync_business_hours_to_barbers();
