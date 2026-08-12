-- Reglas extra para cupones, acordadas en conversación:
--   1) restringir a un servicio y/o barbero específico
--   2) restringir por mínimo/máximo de visitas completadas con esa barbería (cliente
--      frecuente o "solo clientes nuevos", según cuál de los dos se use)
--   3) restringir por gasto acumulado mínimo
--   4) restringir por día de la semana / horario de la cita
--   5) plazo personal de canje: cuenta desde que se le notifica el cupón a CADA
--      cliente, no desde la fecha general del cupón (coupon_claims cubre esto)
--   6) cupón de bienvenida "plataforma" (is_platform_wide), no atado a una sola
--      barbería — solo lo puede crear el backend con service_role (super admin),
--      por eso barberia_id se vuelve nullable pero con el check de abajo.

alter table public.coupons
  alter column barberia_id drop not null,
  add column service_id uuid references public.services(id) on delete set null,
  add column barber_membership_id uuid references public.barberia_memberships(id) on delete set null,
  add column minimum_visits integer check (minimum_visits >= 0),
  add column maximum_visits integer check (maximum_visits >= 0),
  add column minimum_spent numeric(12,2) check (minimum_spent >= 0),
  add column valid_weekdays smallint[],
  add column valid_time_start time,
  add column valid_time_end time,
  add column redemption_window_days integer not null default 5 check (redemption_window_days > 0),
  add column is_platform_wide boolean not null default false,
  add constraint coupons_barberia_scope check (is_platform_wide or barberia_id is not null);

-- Registra, por cliente, cuándo se le notificó un cupón específico y cuándo se le
-- vence su plazo personal (coupons.redemption_window_days desde notified_at).
-- Solo el backend (service_role) escribe aquí; el cliente solo puede leer lo suyo.
create table public.coupon_claims (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  notified_at timestamptz not null default now(),
  reminder_sent_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (coupon_id, client_id)
);
create index coupon_claims_reminder_idx on public.coupon_claims(notified_at) where reminder_sent_at is null;
create index coupon_claims_client_idx on public.coupon_claims(client_id);

alter table public.coupon_claims enable row level security;
create policy coupon_claims_self_read on public.coupon_claims
  for select to authenticated
  using (client_id = auth.uid());
