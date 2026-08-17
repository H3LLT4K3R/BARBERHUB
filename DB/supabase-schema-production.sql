-- ============================================================
-- BARBERHUB · ESQUEMA DE PRODUCCIÓN PARA SUPABASE
-- Ejecutar en un proyecto Supabase NUEVO.
-- Usuarios, contraseñas y MFA son responsabilidad de auth.users.
-- ============================================================

create extension if not exists pgcrypto;
create extension if not exists btree_gist;
create extension if not exists postgis;

create type public.membership_role as enum ('owner', 'admin', 'barber');
create type public.appointment_status as enum ('pending_payment', 'pending_confirmation', 'confirmed', 'rejected', 'cancelled', 'in_progress', 'completed', 'no_show');
create type public.payment_status as enum ('pending', 'authorized', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back', 'failed');
create type public.provider_account_status as enum ('pending_review', 'approved', 'rejected', 'disabled');
create type public.discount_type as enum ('percent', 'fixed');
create type public.notification_type as enum ('appointment', 'payment', 'review', 'promotion', 'inventory', 'system');
create type public.inventory_movement_type as enum ('purchase', 'adjustment_in', 'adjustment_out', 'consumption', 'waste', 'return');
create type public.financial_transaction_type as enum ('income', 'expense', 'refund', 'adjustment');

-- -------------------- IDENTIDAD -----------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  phone text,
  avatar_path text,
  timezone text not null default 'America/Mexico_City',
  locale text not null default 'es-MX',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'principal',
  address_line1 text not null,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  location geography(point, 4326),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, label)
);
create unique index user_addresses_one_default_idx on public.user_addresses(profile_id) where is_default;

-- -------------------- BARBERÍAS Y PERMISOS ------------------
create table public.barberias (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  legal_name text,
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text,
  phone text,
  email text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text,
  country_code char(2) not null default 'MX',
  location geography(point, 4326),
  timezone text not null default 'America/Mexico_City',
  currency_code char(3) not null default 'MXN',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index barberias_location_gix on public.barberias using gist(location);
create index barberias_published_idx on public.barberias(is_published) where is_published;

create table public.barberia_memberships (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role public.membership_role not null,
  display_name text,
  bio text,
  specialty text,
  avatar_path text,
  accepts_appointments boolean not null default true,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barberia_id, profile_id)
);
create unique index barberias_one_active_owner_idx on public.barberia_memberships(barberia_id) where role = 'owner' and is_active;
create index memberships_profile_idx on public.barberia_memberships(profile_id) where is_active;

-- Ajustes de la vista de barbero; son por sucursal, no globales.
create table public.barber_settings (
  membership_id uuid primary key references public.barberia_memberships(id) on delete cascade,
  accepting_appointments boolean not null default true,
  auto_accept_appointments boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (accepting_appointments or not auto_accept_appointments)
);
create table public.barber_notification_preferences (
  membership_id uuid primary key references public.barberia_memberships(id) on delete cascade,
  new_appointment_alerts boolean not null default true,
  cancellation_alerts boolean not null default true,
  review_alerts boolean not null default true,
  daily_summary_alerts boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_modules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z][a-z0-9_]{1,62}$'),
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create table public.barberia_modules (
  barberia_id uuid not null references public.barberias(id) on delete cascade,
  module_id uuid not null references public.platform_modules(id) on delete restrict,
  enabled boolean not null default true,
  configured_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (barberia_id, module_id)
);
create table public.membership_module_permissions (
  membership_id uuid not null references public.barberia_memberships(id) on delete cascade,
  module_id uuid not null references public.platform_modules(id) on delete restrict,
  can_view boolean not null default true,
  can_manage boolean not null default false,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (membership_id, module_id),
  check (not can_manage or can_view)
);

-- -------------------- CATÁLOGO Y MEDIOS ---------------------
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete cascade,
  name text not null,
  sort_order smallint not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barberia_id, name)
);
create table public.services (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null,
  description text,
  duration_minutes smallint not null check (duration_minutes between 5 and 480),
  price numeric(12,2) not null check (price >= 0),
  is_active boolean not null default true,
  sort_order smallint not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barberia_id, name)
);
create index services_catalog_idx on public.services(barberia_id, is_active, sort_order);
create table public.staff_services (
  membership_id uuid not null references public.barberia_memberships(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  custom_duration_minutes smallint check (custom_duration_minutes between 5 and 480),
  custom_price numeric(12,2) check (custom_price >= 0),
  is_active boolean not null default true,
  primary key (membership_id, service_id)
);
create table public.barberia_media (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete cascade,
  storage_path text not null unique,
  alt_text text,
  sort_order smallint not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index barberia_media_one_cover_idx on public.barberia_media(barberia_id) where is_cover;

-- -------------------- DISPONIBILIDAD Y CITAS ----------------
create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (barberia_id, weekday),
  check (is_closed or opens_at < closes_at)
);
create table public.staff_availability (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.barberia_memberships(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (membership_id, weekday), check (starts_at < ends_at)
);
create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete cascade,
  membership_id uuid references public.barberia_memberships(id) on delete cascade,
  exception_date date not null,
  starts_at time,
  ends_at time,
  is_closed boolean not null default false,
  reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (is_closed or (starts_at is not null and ends_at is not null and starts_at < ends_at)),
  unique nulls not distinct (barberia_id, membership_id, exception_date)
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  confirmation_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  barberia_id uuid not null references public.barberias(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  barber_membership_id uuid references public.barberia_memberships(id) on delete restrict,
  scheduled_at timestamptz not null,
  duration_minutes smallint not null check (duration_minutes between 5 and 480),
  status public.appointment_status not null default 'pending_payment',
  client_note text,
  internal_note text,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(12,2) not null default 0 check (discount_total >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancellation_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (discount_total <= subtotal),
  check (total = subtotal - discount_total),
  check ((status not in ('cancelled', 'rejected') and cancelled_at is null) or cancelled_at is not null)
);
alter table public.appointments add constraint appointments_no_barber_overlap exclude using gist (
  barber_membership_id with =,
  tstzrange(scheduled_at, scheduled_at + duration_minutes * interval '1 minute', '[)') with &&
) where (barber_membership_id is not null and status in ('pending_confirmation', 'confirmed', 'in_progress'));
create index appointments_client_idx on public.appointments(client_id, scheduled_at desc);
create index appointments_barber_idx on public.appointments(barber_membership_id, scheduled_at) where barber_membership_id is not null;
create index appointments_barberia_idx on public.appointments(barberia_id, scheduled_at);
create table public.appointment_services (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  duration_minutes smallint not null check (duration_minutes between 5 and 480),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity smallint not null default 1 check (quantity between 1 and 20),
  primary key (appointment_id, service_name)
);
create table public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  from_status public.appointment_status,
  to_status public.appointment_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

-- -------------------- PAGOS MERCADO PAGO --------------------
create table public.payment_provider_accounts (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete restrict,
  provider text not null default 'mercado_pago',
  external_account_id text,
  payment_link text,
  status public.provider_account_status not null default 'pending_review',
  requested_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (barberia_id, provider)
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete restrict,
  provider_account_id uuid references public.payment_provider_accounts(id) on delete set null,
  payer_id uuid not null references public.profiles(id) on delete restrict,
  provider text not null default 'mercado_pago',
  provider_payment_id text,
  preference_id text,
  checkout_url text,
  amount numeric(12,2) not null check (amount > 0),
  currency_code char(3) not null default 'MXN',
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  idempotency_key uuid not null default gen_random_uuid(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id), unique (idempotency_key)
);
create index payments_appointment_idx on public.payments(appointment_id);
create index payments_status_idx on public.payments(status);
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique (provider, provider_event_id)
);
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  reason text,
  provider_refund_id text unique,
  status public.payment_status not null default 'pending',
  requested_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- -------------------- CLIENTES Y COMERCIAL ------------------
create table public.favorite_barberias (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  barberia_id uuid not null references public.barberias(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, barberia_id)
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  barberia_id uuid not null references public.barberias(id) on delete restrict,
  barber_membership_id uuid references public.barberia_memberships(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  owner_response text,
  owner_response_at timestamptz,
  is_published boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index reviews_barberia_idx on public.reviews(barberia_id, is_published, created_at desc);
create index reviews_featured_idx on public.reviews(barberia_id, is_featured) where is_featured and is_published;
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  action_url text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_unread_idx on public.notifications(profile_id, created_at desc) where read_at is null;
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete restrict,
  code text not null,
  description text,
  discount_type public.discount_type not null,
  discount_value numeric(12,2) not null check (discount_value > 0),
  minimum_subtotal numeric(12,2) not null default 0 check (minimum_subtotal >= 0),
  maximum_discount numeric(12,2) check (maximum_discount > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  usage_limit integer check (usage_limit > 0),
  per_client_limit integer not null default 1 check (per_client_limit > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (barberia_id, code),
  check (ends_at > starts_at),
  check ((discount_type = 'percent' and discount_value <= 100) or discount_type = 'fixed')
);
create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  appointment_id uuid not null unique references public.appointments(id) on delete restrict,
  client_id uuid not null references public.profiles(id) on delete restrict,
  discount_amount numeric(12,2) not null check (discount_amount > 0),
  created_at timestamptz not null default now()
);
create index coupon_redemptions_client_idx on public.coupon_redemptions(coupon_id, client_id);
create table public.loyalty_accounts (
  barberia_id uuid not null references public.barberias(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  points_balance integer not null default 0 check (points_balance >= 0),
  tier text not null default 'bronce',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (barberia_id, profile_id)
);
create table public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null,
  profile_id uuid not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  points_delta integer not null check (points_delta <> 0),
  reason text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (barberia_id, profile_id) references public.loyalty_accounts(barberia_id, profile_id) on delete restrict
);

-- -------------------- INVENTARIO Y FINANZAS -----------------
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete restrict,
  name text not null, phone text, email text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (barberia_id, name)
);
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete restrict,
  supplier_id uuid references public.suppliers(id) on delete set null,
  sku text, name text not null, description text,
  unit text not null default 'pieza',
  stock_on_hand numeric(12,3) not null default 0 check (stock_on_hand >= 0),
  reorder_level numeric(12,3) not null default 0 check (reorder_level >= 0),
  unit_cost numeric(12,2) check (unit_cost >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (barberia_id, sku), unique (barberia_id, name)
);
create index inventory_low_stock_idx on public.inventory_items(barberia_id) where stock_on_hand <= reorder_level and is_active;
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  type public.inventory_movement_type not null,
  quantity numeric(12,3) not null check (quantity <> 0),
  unit_cost numeric(12,2) check (unit_cost >= 0),
  reason text,
  performed_by uuid references public.profiles(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  barberia_id uuid not null references public.barberias(id) on delete restrict,
  payment_id uuid references public.payments(id) on delete set null,
  type public.financial_transaction_type not null,
  category text not null,
  amount numeric(12,2) not null check (amount > 0),
  occurred_at timestamptz not null default now(),
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index financial_transactions_report_idx on public.financial_transactions(barberia_id, occurred_at desc);
create table public.audit_log (
  id bigint generated always as identity primary key,
  barberia_id uuid references public.barberias(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null, entity_type text not null, entity_id uuid,
  old_data jsonb, new_data jsonb,
  created_at timestamptz not null default now()
);

-- -------------------- FUNCIONES Y TRIGGERS ------------------
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function public.create_profile_for_auth_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile_for_auth_user();

create or replace function public.provision_barber_settings() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'barber' then
    insert into public.barber_settings(membership_id) values (new.id) on conflict do nothing;
    insert into public.barber_notification_preferences(membership_id) values (new.id) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger memberships_provision_barber_settings after insert on public.barberia_memberships for each row execute function public.provision_barber_settings();

create or replace function public.sync_loyalty_balance() returns trigger language plpgsql as $$
begin update public.loyalty_accounts set points_balance = points_balance + new.points_delta where barberia_id = new.barberia_id and profile_id = new.profile_id; return new; end $$;
create trigger loyalty_ledger_balance after insert on public.loyalty_ledger for each row execute function public.sync_loyalty_balance();

create or replace function public.apply_inventory_movement() returns trigger language plpgsql as $$
begin update public.inventory_items set stock_on_hand = stock_on_hand + new.quantity where id = new.inventory_item_id; return new; end $$;
create trigger inventory_movement_stock after insert on public.inventory_movements for each row execute function public.apply_inventory_movement();

create or replace function public.log_appointment_status() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.appointment_status_history(appointment_id, from_status, to_status)
    values (new.id, case when tg_op = 'INSERT' then null else old.status end, new.status);
  end if;
  return new;
end $$;
create trigger appointment_status_log after insert or update of status on public.appointments for each row execute function public.log_appointment_status();

create or replace function public.validate_appointment_scope() returns trigger language plpgsql as $$
begin
  if new.barber_membership_id is not null and not exists (
    select 1 from public.barberia_memberships m where m.id = new.barber_membership_id and m.barberia_id = new.barberia_id and m.role = 'barber' and m.is_active
  ) then raise exception 'The selected barber does not belong to this barberia'; end if;
  return new;
end $$;
create trigger appointments_validate_scope before insert or update of barberia_id, barber_membership_id on public.appointments for each row execute function public.validate_appointment_scope();

create or replace function public.validate_appointment_service_scope() returns trigger language plpgsql as $$
begin
  if new.service_id is not null and not exists (
    select 1 from public.services s join public.appointments a on a.id = new.appointment_id where s.id = new.service_id and s.barberia_id = a.barberia_id
  ) then raise exception 'Service does not belong to this barberia'; end if;
  return new;
end $$;
create trigger appointment_services_validate_scope before insert or update on public.appointment_services for each row execute function public.validate_appointment_service_scope();

create or replace function public.validate_review_scope() returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from public.appointments a where a.id = new.appointment_id and a.client_id = new.client_id and a.barberia_id = new.barberia_id and a.status = 'completed' and (new.barber_membership_id is null or new.barber_membership_id = a.barber_membership_id)
  ) then raise exception 'Reviews require a completed appointment belonging to the client'; end if;
  return new;
end $$;
create trigger reviews_validate_scope before insert or update on public.reviews for each row execute function public.validate_review_scope();

do $$ declare t text; begin
  foreach t in array array['profiles','user_addresses','barberias','barberia_memberships','barber_settings','barber_notification_preferences','barberia_modules','membership_module_permissions','service_categories','services','business_hours','staff_availability','availability_exceptions','appointments','payment_provider_accounts','payments','refunds','reviews','coupons','loyalty_accounts','suppliers','inventory_items'] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_updated_at_' || t, t);
  end loop;
end $$;

-- -------------------- RLS Y AUTORIZACIÓN --------------------
create or replace function public.is_member(p_barberia uuid, p_roles public.membership_role[] default null) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.barberia_memberships m where m.barberia_id = p_barberia and m.profile_id = auth.uid() and m.is_active and (p_roles is null or m.role = any(p_roles)))
$$;
create or replace function public.owns_barberia(p_barberia uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_member(p_barberia, array['owner']::public.membership_role[])
$$;
create or replace function public.create_barberia(p_slug text, p_name text, p_address text, p_city text, p_state text, p_location geography default null) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.barberias(slug, name, address_line1, city, state, location) values(lower(p_slug), p_name, p_address, p_city, p_state, p_location) returning id into v_id;
  insert into public.barberia_memberships(barberia_id, profile_id, role) values(v_id, auth.uid(), 'owner');
  insert into public.barberia_modules(barberia_id, module_id, configured_by) select v_id, id, auth.uid() from public.platform_modules;
  return v_id;
end $$;
revoke all on function public.create_barberia(text,text,text,text,text,geography) from public, anon;
grant execute on function public.create_barberia(text,text,text,text,text,geography) to authenticated;

alter table public.profiles enable row level security;
alter table public.user_addresses enable row level security;
alter table public.barberias enable row level security;
alter table public.barberia_memberships enable row level security;
alter table public.barber_settings enable row level security;
alter table public.barber_notification_preferences enable row level security;
alter table public.platform_modules enable row level security;
alter table public.barberia_modules enable row level security;
alter table public.membership_module_permissions enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.staff_services enable row level security;
alter table public.barberia_media enable row level security;
alter table public.business_hours enable row level security;
alter table public.staff_availability enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;
alter table public.appointment_status_history enable row level security;
alter table public.payment_provider_accounts enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
alter table public.refunds enable row level security;
alter table public.reviews enable row level security;
alter table public.favorite_barberias enable row level security;
alter table public.notifications enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.audit_log enable row level security;

create policy profiles_self on public.profiles for all to authenticated using(id = auth.uid()) with check(id = auth.uid());
create policy profiles_staff_read_clients on public.profiles for select to authenticated using(
  exists (select 1 from public.appointments a where a.client_id = profiles.id and public.is_member(a.barberia_id))
);
create policy addresses_self on public.user_addresses for all to authenticated using(profile_id = auth.uid()) with check(profile_id = auth.uid());
create policy public_barberias_read on public.barberias for select using(is_published or public.is_member(id));
create policy owner_barberias_update on public.barberias for update to authenticated using(public.owns_barberia(id)) with check(public.owns_barberia(id));
create policy memberships_read on public.barberia_memberships for select using(is_active or public.is_member(barberia_id));
create policy owner_memberships_manage on public.barberia_memberships for all to authenticated using(public.owns_barberia(barberia_id)) with check(public.owns_barberia(barberia_id));
create policy barber_settings_read_own on public.barber_settings for select to authenticated using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and m.profile_id = auth.uid() and m.role = 'barber' and m.is_active));
create policy barber_settings_update_own on public.barber_settings for update to authenticated using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and m.profile_id = auth.uid() and m.role = 'barber' and m.is_active)) with check(exists(select 1 from public.barberia_memberships m where m.id = membership_id and m.profile_id = auth.uid() and m.role = 'barber' and m.is_active));
create policy barber_notification_preferences_read_own on public.barber_notification_preferences for select to authenticated using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and m.profile_id = auth.uid() and m.role = 'barber' and m.is_active));
create policy barber_notification_preferences_update_own on public.barber_notification_preferences for update to authenticated using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and m.profile_id = auth.uid() and m.role = 'barber' and m.is_active)) with check(exists(select 1 from public.barberia_memberships m where m.id = membership_id and m.profile_id = auth.uid() and m.role = 'barber' and m.is_active));
create policy modules_read on public.platform_modules for select using(true);
create policy barberia_modules_read on public.barberia_modules for select using(public.is_member(barberia_id));
create policy owner_barberia_modules_manage on public.barberia_modules for all to authenticated using(public.owns_barberia(barberia_id)) with check(public.owns_barberia(barberia_id));
create policy permissions_read_own on public.membership_module_permissions for select using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and (m.profile_id = auth.uid() or public.owns_barberia(m.barberia_id))));
create policy owner_permissions_manage on public.membership_module_permissions for all to authenticated using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and public.owns_barberia(m.barberia_id))) with check(exists(select 1 from public.barberia_memberships m where m.id = membership_id and public.owns_barberia(m.barberia_id)));
create policy categories_read on public.service_categories for select using(true);
create policy categories_manage on public.service_categories for all to authenticated using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[])) with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));
create policy services_read on public.services for select using(is_active or public.is_member(barberia_id));
create policy services_manage on public.services for all to authenticated using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[])) with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));
create policy staff_services_read on public.staff_services for select using(true);
create policy staff_services_manage on public.staff_services for all to authenticated using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[]))) with check(exists(select 1 from public.barberia_memberships m where m.id = membership_id and public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[])));
create policy barberia_media_public_read on public.barberia_media for select using(exists(select 1 from public.barberias b where b.id = barberia_id and (b.is_published or public.is_member(b.id))));
create policy barberia_media_manage on public.barberia_media for all to authenticated using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[])) with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));
create policy business_hours_read on public.business_hours for select using(true);
create policy business_hours_manage on public.business_hours for all to authenticated using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[])) with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));
create policy staff_availability_read on public.staff_availability for select using(true);
create policy staff_availability_manage on public.staff_availability for all to authenticated using(exists(select 1 from public.barberia_memberships m where m.id = membership_id and (m.profile_id = auth.uid() or public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[])))) with check(exists(select 1 from public.barberia_memberships m where m.id = membership_id and (m.profile_id = auth.uid() or public.is_member(m.barberia_id,array['owner','admin']::public.membership_role[]))));
create policy exceptions_read on public.availability_exceptions for select using(true);
create policy exceptions_manage on public.availability_exceptions for all to authenticated using(public.is_member(barberia_id,array['owner','admin','barber']::public.membership_role[])) with check(public.is_member(barberia_id,array['owner','admin','barber']::public.membership_role[]));
create policy appointments_client_or_staff_read on public.appointments for select to authenticated using(client_id = auth.uid() or public.is_member(barberia_id));
create policy appointments_client_create on public.appointments for insert to authenticated with check(client_id = auth.uid());
create policy appointments_client_cancel on public.appointments for update to authenticated using(client_id = auth.uid() and status in ('pending_payment','pending_confirmation','confirmed')) with check(client_id = auth.uid());
create policy appointments_staff_update on public.appointments for update to authenticated using(public.is_member(barberia_id,array['owner','admin','barber']::public.membership_role[])) with check(public.is_member(barberia_id,array['owner','admin','barber']::public.membership_role[]));
create policy appointment_services_read on public.appointment_services for select to authenticated using(exists(select 1 from public.appointments a where a.id = appointment_id and (a.client_id = auth.uid() or public.is_member(a.barberia_id))));
create policy appointment_status_history_read on public.appointment_status_history for select to authenticated using(exists(select 1 from public.appointments a where a.id = appointment_id and (a.client_id = auth.uid() or public.is_member(a.barberia_id))));
create policy payments_parties_read on public.payments for select to authenticated using(payer_id = auth.uid() or exists(select 1 from public.appointments a where a.id = appointment_id and public.is_member(a.barberia_id)));
create policy payment_accounts_staff_read on public.payment_provider_accounts for select to authenticated using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));
create policy payment_accounts_owner_manage on public.payment_provider_accounts for all to authenticated using(public.owns_barberia(barberia_id)) with check(public.owns_barberia(barberia_id));
create policy favorites_self on public.favorite_barberias for all to authenticated using(profile_id = auth.uid()) with check(profile_id = auth.uid());
create policy reviews_public_read on public.reviews for select using(is_published or client_id = auth.uid() or public.is_member(barberia_id));
create policy reviews_client_create on public.reviews for insert to authenticated with check(client_id = auth.uid());
create policy notifications_self_read on public.notifications for select to authenticated using(profile_id = auth.uid());
create policy notifications_self_update on public.notifications for update to authenticated using(profile_id = auth.uid()) with check(profile_id = auth.uid());
create policy coupons_read on public.coupons for select using(is_active or public.is_member(barberia_id));
create policy coupons_manage on public.coupons for all to authenticated using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[])) with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));
create policy loyalty_accounts_own_or_staff on public.loyalty_accounts for select to authenticated using(profile_id = auth.uid() or public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));
create policy suppliers_staff on public.suppliers for all to authenticated using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[])) with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));
create policy inventory_staff on public.inventory_items for all to authenticated using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[])) with check(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));
create policy inventory_movements_staff_read on public.inventory_movements for select to authenticated using(exists(select 1 from public.inventory_items i where i.id = inventory_item_id and public.is_member(i.barberia_id,array['owner','admin']::public.membership_role[])));
create policy financial_transactions_staff_read on public.financial_transactions for select to authenticated using(public.is_member(barberia_id,array['owner','admin']::public.membership_role[]));

-- -------------------- MÓDULOS Y DATOS DEMO -----------------
insert into public.platform_modules(code, name, description) values
  ('agenda','Agenda','Citas y disponibilidad'),
  ('catalogo','Catálogo','Servicios y precios'),
  ('clientes','Clientes','Historial de clientes'),
  ('pagos','Pagos','Cobros y anticipos'),
  ('finanzas','Finanzas','Ingresos y gastos'),
  ('inventario','Inventario','Productos e insumos'),
  ('cupones','Cupones','Promociones'),
  ('fidelidad','Fidelidad','Puntos y recompensas'),
  ('opiniones','Opiniones','Reseñas'),
  ('estadisticas','Estadísticas','Reportes')
on conflict(code) do nothing;

create or replace function public.seed_barberhub_demo(p_owner uuid, p_barber uuid, p_client uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare v_barberia uuid; v_barber_membership uuid; v_service uuid;
begin
  insert into public.barberias(slug,name,address_line1,city,state,location,is_published)
  values('urban-cuts-demo','Urban Cuts','Blvd. 5 de Mayo 5','Puebla','Puebla',st_setsrid(st_makepoint(-98.2063,19.0414),4326)::geography,true) returning id into v_barberia;
  insert into public.barberia_memberships(barberia_id,profile_id,role) values(v_barberia,p_owner,'owner');
  insert into public.barberia_memberships(barberia_id,profile_id,role,specialty) values(v_barberia,p_barber,'barber','Corte y barba') returning id into v_barber_membership;
  insert into public.services(barberia_id,name,duration_minutes,price) values(v_barberia,'Corte y barba',45,330) returning id into v_service;
  insert into public.staff_services(membership_id,service_id) values(v_barber_membership,v_service);
  insert into public.business_hours(barberia_id,weekday,opens_at,closes_at) select v_barberia,d,'09:00','20:00' from generate_series(1,6) d;
  insert into public.staff_availability(membership_id,weekday,starts_at,ends_at) select v_barber_membership,d,'09:00','20:00' from generate_series(1,6) d;
  insert into public.barberia_modules(barberia_id,module_id,configured_by) select v_barberia,id,p_owner from public.platform_modules;
  insert into public.loyalty_accounts(barberia_id,profile_id) values(v_barberia,p_client);
  return v_barberia;
end $$;

-- -------------------- CATÁLOGO PÚBLICO (para Explorar) --------------------
-- PostgREST devuelve las columnas "geography" como WKB hexadecimal, no como
-- lat/lng utilizables en JS. Esta vista ya expone coordenadas, calificación
-- promedio y precio de entrada, todo filtrado a barberías publicadas.
create or replace view public.barberias_public as
select
  b.id, b.slug, b.name, b.description, b.address_line1, b.city, b.state,
  b.currency_code,
  st_y(b.location::geometry) as lat,
  st_x(b.location::geometry) as lng,
  coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.barberia_id = b.id and r.is_published), 0) as rating,
  (select count(*) from public.reviews r where r.barberia_id = b.id and r.is_published) as total_opiniones,
  (select min(s.price) from public.services s where s.barberia_id = b.id and s.is_active) as precio_desde,
  b.zone,
  (select m.storage_path from public.barberia_media m where m.barberia_id = b.id and m.is_cover) as cover_path
from public.barberias b
where b.is_published and not b.is_suspended;

grant select on public.barberias_public to anon, authenticated;
