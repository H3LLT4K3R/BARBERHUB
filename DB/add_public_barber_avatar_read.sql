-- Permite que cualquier usuario autenticado (p. ej. un cliente viendo el perfil de una
-- barbería) pueda leer el nombre y la foto de perfil de un barbero activo, siempre que
-- pertenezca a una barbería publicada. No expone nada de dueños/administradores ni de
-- barberías no publicadas, y no reemplaza la policy "profiles_self" existente (solo agrega
-- un caso adicional de lectura, en paralelo).
create policy profiles_public_barber_read on public.profiles for select
using (
  exists (
    select 1
    from public.barberia_memberships m
    join public.barberias b on b.id = m.barberia_id
    where m.profile_id = profiles.id
      and m.role = 'barber'
      and m.is_active
      and b.is_published
  )
);
