create table public.client_notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  appointment_reminders boolean not null default true,
  appointment_confirmed_alerts boolean not null default true,
  new_coupon_alerts boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_notification_preferences enable row level security;

create policy client_notification_preferences_self on public.client_notification_preferences
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create trigger set_updated_at_client_notification_preferences
  before update on public.client_notification_preferences
  for each row execute function public.set_updated_at();

create or replace function public.provision_client_notification_preferences() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.client_notification_preferences(profile_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger profiles_provision_notification_preferences
  after insert on public.profiles
  for each row execute function public.provision_client_notification_preferences();

-- Backfill: crea la fila de preferencias para los perfiles que ya existen hoy.
insert into public.client_notification_preferences(profile_id)
select id from public.profiles
on conflict do nothing;
