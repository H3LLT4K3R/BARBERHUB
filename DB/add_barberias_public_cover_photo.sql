-- Agrega la foto de portada de la barbería (barberia_media con is_cover = true) a la
-- vista pública que consume Explorar, para poder mostrarla en vez del ícono genérico
-- en la tarjeta de la lista y en el marcador del mapa.
--
-- Recrea la vista tal cual quedó tras add_barberia_suscripcion.sql (con "zone" y el
-- filtro "not is_suspended") y solo agrega cover_path al final.
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
