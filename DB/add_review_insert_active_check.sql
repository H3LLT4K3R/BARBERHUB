-- Igual que crearCita en el backend: la política de insertar reseñas solo
-- verificaba client_id = auth.uid(), sin revisar si la cuenta sigue activa.
-- Una cuenta anonimizada/eliminada (profiles.is_active = false) con una sesión
-- todavía válida podía seguir dejando reseñas nuevas mientras esa sesión no
-- expirara. El guard del frontend ya la saca de esas pantallas, pero la
-- política es la última línea de defensa real.
drop policy if exists reviews_client_create on public.reviews;
create policy reviews_client_create on public.reviews
  for insert to authenticated
  with check (
    client_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
  );
