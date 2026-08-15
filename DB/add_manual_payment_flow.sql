-- Flujo de pago manual (sin API de Mercado Pago integrada): el owner pega el link
-- de pago de su propia cuenta de Mercado Pago, el cliente paga ahí fuera y sube un
-- comprobante, y el barbero/owner lo revisa y confirma manualmente. El flujo automático
-- (crearPreferencia + webhook) se deja intacto y sin usarse, listo por si algún día se
-- retoma la integración directa.

alter table public.barberias add column if not exists payment_link_url text;
alter table public.payments add column if not exists proof_image_path text;

-- Nuevo estado: comprobante subido, esperando que el barbero/owner lo revise.
alter type public.payment_status add value if not exists 'pending_review';

-- Bucket privado para comprobantes de pago (a diferencia de "perfiles", que es público).
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- Solo el cliente dueño de la cita puede subir/reemplazar su propio comprobante,
-- en comprobantes/{appointment_id}/...
create policy "comprobantes_client_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprobantes'
    and exists (
      select 1 from public.appointments a
      where a.id::text = (storage.foldername(name))[1]
        and a.client_id = auth.uid()
    )
  );

create policy "comprobantes_client_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'comprobantes'
    and exists (
      select 1 from public.appointments a
      where a.id::text = (storage.foldername(name))[1]
        and a.client_id = auth.uid()
    )
  );

-- El cliente que lo subió y el staff de esa barbería pueden verlo (bucket privado,
-- se accede con URL firmada, no pública).
create policy "comprobantes_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'comprobantes'
    and exists (
      select 1 from public.appointments a
      where a.id::text = (storage.foldername(name))[1]
        and (a.client_id = auth.uid() or public.is_member(a.barberia_id))
    )
  );
