-- Bucket público para fotos de perfil (avatar) y portafolio de trabajos de los barberos.
insert into storage.buckets (id, name, public)
values ('perfiles', 'perfiles', true)
on conflict (id) do nothing;

-- Cualquiera puede VER las fotos (son públicas, se muestran en la app).
create policy "perfiles_public_read" on storage.objects
  for select using (bucket_id = 'perfiles');

-- Cada usuario solo puede subir/editar/borrar su PROPIO avatar, en avatars/{su_uid}/...
create policy "perfiles_avatar_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "perfiles_avatar_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "perfiles_avatar_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Solo el barbero dueño de esa membresía puede subir/borrar fotos en portfolio/{membership_id}/...
create policy "perfiles_portfolio_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = 'portfolio'
    and exists (
      select 1 from public.barberia_memberships m
      where m.id::text = (storage.foldername(name))[2] and m.profile_id = auth.uid()
    )
  );

create policy "perfiles_portfolio_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = 'portfolio'
    and exists (
      select 1 from public.barberia_memberships m
      where m.id::text = (storage.foldername(name))[2] and m.profile_id = auth.uid()
    )
  );

-- Metadatos de las fotos del portafolio (la imagen en sí vive en Storage, esto solo guarda la ruta).
create table public.barber_portfolio_images (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.barberia_memberships(id) on delete cascade,
  image_path text not null,
  created_at timestamptz not null default now()
);

alter table public.barber_portfolio_images enable row level security;

create policy barber_portfolio_images_read on public.barber_portfolio_images
  for select using (true);

create policy barber_portfolio_images_manage on public.barber_portfolio_images
  for all to authenticated
  using (exists (select 1 from public.barberia_memberships m where m.id = membership_id and m.profile_id = auth.uid()))
  with check (exists (select 1 from public.barberia_memberships m where m.id = membership_id and m.profile_id = auth.uid()));
