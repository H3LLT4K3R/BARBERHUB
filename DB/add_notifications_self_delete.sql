-- Permite al dueño de una notificación borrarla (hoy solo existe SELECT/UPDATE propios).
create policy notifications_self_delete on public.notifications
  for delete to authenticated
  using (profile_id = auth.uid());
