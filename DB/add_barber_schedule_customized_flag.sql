-- Refina la sincronización de add_business_hours_owner_only_sync.sql: solo debe
-- sobrescribir el horario individual de un barbero que TODAVÍA no lo ha tocado él
-- mismo (o sea, sigue igual a como se lo sembró la barbería). En cuanto el barbero
-- edita su propio horario desde Perfil Barbero, queda "personalizado" y los cambios
-- futuros del owner en Horarios de atención ya no lo vuelven a pisar.
alter table public.barber_settings add column if not exists schedule_customized boolean not null default false;

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
    join public.barber_settings bs on bs.membership_id = m.id
    where sa.membership_id = m.id
      and m.barberia_id = new.barberia_id
      and m.role = 'barber'
      and m.is_active
      and not bs.schedule_customized
      and sa.weekday = new.weekday;
  else
    insert into public.staff_availability (membership_id, weekday, starts_at, ends_at)
    select m.id, new.weekday, new.opens_at, new.closes_at
    from public.barberia_memberships m
    join public.barber_settings bs on bs.membership_id = m.id
    where m.barberia_id = new.barberia_id
      and m.role = 'barber'
      and m.is_active
      and not bs.schedule_customized
    on conflict (membership_id, weekday) do update
      set starts_at = excluded.starts_at, ends_at = excluded.ends_at;
  end if;
  return new;
end;
$$;
