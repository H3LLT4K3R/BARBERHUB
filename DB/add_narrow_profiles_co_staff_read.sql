-- "profiles_co_staff_read" se agregó para que owner-seguridad.jsx pudiera mostrar el
-- nombre del equipo del dueño (barberos/admins), pero la política dejaba pasar a
-- CUALQUIER miembro activo del staff, no solo al dueño — un barbero podía, desde la
-- consola del navegador, leer la fila completa de perfil (incluido el teléfono) de
-- cualquier compañero o del propio dueño de su barbería, aunque ninguna pantalla lo
-- use así (owner-seguridad.jsx es la única que consulta esto, y ya se limita a
-- role='owner' en el código). Se acota la política para que coincida con su
-- propósito real: solo el dueño puede leer los perfiles completos de su equipo.
drop policy if exists profiles_co_staff_read on public.profiles;
create policy profiles_co_staff_read on public.profiles for select to authenticated
using (
  exists (
    select 1
    from public.barberia_memberships m1
    join public.barberia_memberships m2 on m2.barberia_id = m1.barberia_id
    where m1.profile_id = auth.uid()
      and m1.role = 'owner'
      and m1.is_active
      and m2.profile_id = profiles.id
      and m2.is_active
  )
);
