-- 1) El barbero puede "ocultar" de su agenda una cita ya terminal (cancelada,
-- rechazada, no-show o completada) sin borrar el registro real: pagos, reseñas
-- e historial del cliente/owner siguen intactos, solo deja de listarse para él.
alter table public.appointments add column if not exists hidden_by_barber_at timestamptz;

-- 2) La tabla barberia_media ya tenía su política de escritura (barberia_media_manage,
-- ver supabase-schema-production.sql) — solo faltaban las políticas de Storage.

-- 3) Storage: la foto de la barbería vive en el mismo bucket "perfiles" (ya público),
-- en la carpeta barberias/{barberia_id}/... Solo owner/admin de esa barbería puede escribir.
create policy "perfiles_barberia_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = 'barberias'
    and exists (
      select 1 from public.barberia_memberships m
      where m.barberia_id::text = (storage.foldername(name))[2]
        and m.profile_id = auth.uid()
        and m.role in ('owner', 'admin')
        and m.is_active
    )
  );

create policy "perfiles_barberia_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = 'barberias'
    and exists (
      select 1 from public.barberia_memberships m
      where m.barberia_id::text = (storage.foldername(name))[2]
        and m.profile_id = auth.uid()
        and m.role in ('owner', 'admin')
        and m.is_active
    )
  );
