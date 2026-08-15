-- Mismo patrón que ya se corrigió en profiles (add_prevent_privilege_escalation.sql)
-- y en barberias (add_prevent_business_tampering.sql): una política "for all" que
-- solo controla QUÉ FILA puede tocar el dueño, no QUÉ COLUMNAS.
--
-- "payment_accounts_owner_manage" deja al dueño insertar/actualizar la fila de
-- payment_provider_accounts de SU barbería (correcto: así envía su link desde
-- owner-control-negocio.jsx vía el backend con pagosController.solicitarLink).
-- Pero nada impide que, desde la consola del navegador, el dueño llame directo a
-- Supabase (con su propio JWT, sin pasar por el backend) y haga:
--   supabase.from('payment_provider_accounts')
--     .upsert({ barberia_id: suPropiaBarberia, provider: 'mercado_pago',
--               status: 'approved', reviewed_at: new Date().toISOString() })
-- y se autoapruebe el link sin que el moderador lo haya revisado nunca — la
-- pantalla le muestra a él mismo (y potencialmente a sus clientes, vía el banner
-- "Tu link ya está aprobado y activo") una insignia de verificación falsa.
--
-- El trigger deja pasar sin tocar cualquier cambio que venga del backend (llave de
-- servicio: aprobarLink usa auth.role() = 'service_role'). Si el cambio viene de un
-- usuario normal: en UPDATE, status/reviewed_by/reviewed_at/rejection_reason se
-- restauran a su valor anterior; en INSERT, se fuerzan a los valores neutros con los
-- que arranca toda solicitud nueva (pending_review, sin revisor). "payment_link" y
-- "provider" no se tocan a propósito: el dueño sí debe poder enviar/editar su propio
-- link.
create or replace function public.prevent_payment_account_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    if tg_op = 'UPDATE' then
      new.status := old.status;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
      new.rejection_reason := old.rejection_reason;
    elsif tg_op = 'INSERT' then
      new.status := 'pending_review';
      new.reviewed_by := null;
      new.reviewed_at := null;
      new.rejection_reason := null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists payment_accounts_prevent_tampering on public.payment_provider_accounts;
create trigger payment_accounts_prevent_tampering
before insert or update on public.payment_provider_accounts
for each row execute function public.prevent_payment_account_tampering();
