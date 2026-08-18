-- Galería de imágenes administrable para la ruleta del landing (hero). Antes la ruleta
-- jalaba fotos de barber_portfolio_images (portafolio real de los barberos), pero eso
-- depende de que un barbero suba trabajo; se agrega esta tabla aparte para que el super
-- admin pueda curar/agregar imágenes de servicios (cortes, barbas, etc.) sin depender de
-- que nadie más suba nada.

create table public.landing_gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.landing_gallery_images enable row level security;

-- Lectura pública (el landing la consume con o sin sesión).
create policy landing_gallery_images_read on public.landing_gallery_images for select using (true);
grant select on public.landing_gallery_images to anon, authenticated;
-- Sin políticas de escritura: solo el backend con la llave de servicio inserta/borra,
-- desde los endpoints exclusivos de super admin (/api/admin/galeria).

-- Las imágenes en sí viven en el bucket "perfiles" (ya público), bajo landing/... — solo
-- el super admin puede subir/borrar ahí.
create policy "perfiles_landing_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = 'landing'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_super_admin)
  );

create policy "perfiles_landing_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'perfiles'
    and (storage.foldername(name))[1] = 'landing'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_super_admin)
  );
