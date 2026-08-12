-- Reemplaza la lectura pública "de fila completa" de profiles por una vista angosta
-- que solo expone id, full_name y avatar_path. Antes, "profiles_public_barber_read"
-- dejaba leer TODA la fila (incluido el teléfono) de cualquier barbero activo en una
-- barbería publicada a quien armara su propia consulta contra la API de Supabase,
-- aunque la app solo pidiera avatar_path en pantalla. Mismo patrón que ya usa
-- "barberias_public" para no exponer la tabla base completa.
--
-- Cubre los dos casos que hoy necesitan mostrar nombre/foto de alguien que no es
-- el usuario actual: barberos activos de una barbería publicada, y clientes que
-- dejaron una reseña publicada en una barbería publicada.

drop policy if exists profiles_public_barber_read on public.profiles;
drop policy if exists profiles_public_reviewer_read on public.profiles;

create or replace view public.profiles_public as
select p.id, p.full_name, p.avatar_path
from public.profiles p
where exists (
  select 1
  from public.barberia_memberships m
  join public.barberias b on b.id = m.barberia_id
  where m.profile_id = p.id
    and m.role = 'barber'
    and m.is_active
    and b.is_published
)
or exists (
  select 1
  from public.reviews r
  join public.barberias b on b.id = r.barberia_id
  where r.client_id = p.id
    and r.is_published
    and b.is_published
);

grant select on public.profiles_public to anon, authenticated;

-- Aparte del caso "público" de arriba, owner-seguridad.jsx (el panel de permisos del
-- dueño) necesita leer el nombre de SU PROPIO equipo (barberos/admins), publicada o no
-- la barbería. Eso no lo cubre "profiles_staff_read_clients" (que es solo para leer
-- perfiles de clientes) ni la vista de arriba (que exige barbería publicada). Se agrega
-- una policy aparte, acotada a compañeros de la misma barbería.
create policy profiles_co_staff_read on public.profiles for select to authenticated
using (
  exists (
    select 1
    from public.barberia_memberships m1
    join public.barberia_memberships m2 on m2.barberia_id = m1.barberia_id
    where m1.profile_id = auth.uid()
      and m1.is_active
      and m2.profile_id = profiles.id
      and m2.is_active
  )
);
