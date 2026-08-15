-- La política de lectura de barberia_memberships ocultaba las filas inactivas
-- incluso al propio dueño de esa fila: un barbero recién desactivado (por él
-- mismo o por el owner) no podía ni siquiera ver que su membresía ya estaba
-- inactiva, porque is_member() exige una membresía ACTIVA para "contar" — y
-- si esa era su única membresía en esa barbería, quedaba invisible para sí
-- mismo. Esto rompía el guard que debe cerrarle la sesión y sacarlo del panel.
-- Cualquiera debe poder ver siempre su propia fila, sin importar is_active.
drop policy if exists memberships_read on public.barberia_memberships;
create policy memberships_read on public.barberia_memberships
  for select
  using (is_active or profile_id = auth.uid() or public.is_member(barberia_id));
