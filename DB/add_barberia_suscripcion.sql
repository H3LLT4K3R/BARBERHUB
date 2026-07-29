alter table public.barberias
  add column subscription_status text not null default 'sin_suscripcion'
    check (subscription_status in ('sin_suscripcion', 'pendiente', 'activa', 'pausada', 'cancelada')),
  add column mp_preapproval_id text,
  add column subscription_amount numeric(12,2),
  add column subscription_next_payment timestamptz,
  -- Control manual del super admin, independiente de "is_published" (que el propio owner puede
  -- prender/apagar). Si is_suspended = true, la barbería no debe verse aunque el owner la publique.
  add column is_suspended boolean not null default false;

-- El listado público de Explorar y el perfil de barbería ya filtran por esta vista:
-- se le agrega "and not is_suspended" para que una barbería suspendida por falta de pago
-- deje de mostrarse sin que el owner pueda revertirlo publicando de nuevo.
create or replace view public.barberias_public as
select
  b.id, b.slug, b.name, b.description, b.address_line1, b.city, b.state,
  b.currency_code,
  st_y(b.location::geometry) as lat,
  st_x(b.location::geometry) as lng,
  coalesce((select round(avg(r.rating)::numeric, 1) from public.reviews r where r.barberia_id = b.id and r.is_published), 0) as rating,
  (select count(*) from public.reviews r where r.barberia_id = b.id and r.is_published) as total_opiniones,
  (select min(s.price) from public.services s where s.barberia_id = b.id and s.is_active) as precio_desde,
  b.zone
from public.barberias b
where b.is_published and not b.is_suspended;
