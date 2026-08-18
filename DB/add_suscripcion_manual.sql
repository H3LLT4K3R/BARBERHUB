-- Segunda vuelta del cobro de suscripción: se quita la creación automática de PreApproval
-- (usaba la cuenta de Mercado Pago configurada en el backend, que va a cambiar por la del
-- encargado real de la empresa). Se reemplaza por el mismo patrón manual que ya usa el
-- cliente para pagar el anticipo (ver add_manual_payment_flow.sql): el super admin pega SU
-- link de pago de Mercado Pago (uno solo, para toda la plataforma), el dueño de cada
-- barbería paga ahí fuera y sube su comprobante, y el super admin lo revisa a mano.

-- Tabla singleton para configuración de la plataforma (hoy solo el link de pago de
-- suscripción). El truco id boolean + check(id) fuerza que solo pueda existir una fila.
create table if not exists public.platform_settings (
  id boolean primary key default true,
  subscription_payment_link_url text,
  constraint platform_settings_singleton check (id)
);
insert into public.platform_settings (id) values (true) on conflict (id) do nothing;

alter table public.platform_settings enable row level security;
-- Sin policies: solo el backend con la llave de servicio lee/escribe esto (el super admin
-- pasa por el endpoint /api/suscripciones/config, protegido por requireSuperAdmin).

alter table public.barberias add column if not exists subscription_proof_image_path text;

-- 'pendiente' era del flujo automático (PreApproval) que ya no se usa; se reemplaza por
-- 'pendiente_revision' (comprobante subido, esperando que el super admin lo revise). No hay
-- filas existentes en 'pendiente' (se verificó antes de esta migración), así que el cambio
-- de constraint es seguro.
alter table public.barberias drop constraint if exists barberias_subscription_status_check;
alter table public.barberias add constraint barberias_subscription_status_check
  check (subscription_status in ('sin_suscripcion', 'pendiente_revision', 'activa', 'pausada', 'cancelada'));

-- El owner sube su comprobante de suscripción en comprobantes/suscripciones/{barberia_id}/...
-- (mismo bucket privado que ya usan los comprobantes de anticipo de citas, con sus mismos
-- límites de tamaño/tipo — ver add_comprobantes_bucket_limits.sql).
create policy "comprobantes_suscripcion_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = 'suscripciones'
    and exists (
      select 1 from public.barberia_memberships m
      where m.barberia_id::text = (storage.foldername(name))[2]
        and m.profile_id = auth.uid()
        and m.role = 'owner'
        and m.is_active
    )
  );

-- El dueño que lo subió y el super admin pueden verlo (bucket privado, URL firmada).
create policy "comprobantes_suscripcion_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'comprobantes'
    and (storage.foldername(name))[1] = 'suscripciones'
    and (
      exists (
        select 1 from public.barberia_memberships m
        where m.barberia_id::text = (storage.foldername(name))[2]
          and m.profile_id = auth.uid()
          and m.is_active
      )
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_super_admin)
    )
  );
