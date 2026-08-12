-- Dos huecos más del mismo tipo que el de is_super_admin: reglas que dejan editar
-- "tu propia fila" sin restringir qué columnas se pueden tocar en esa fila.
-- Ambos se probaron en vivo con cuentas de prueba reales antes de este fix.

-- ============================================================
-- 1) Un dueño podía reactivar su propia barbería suspendida
-- ============================================================
-- "owner_barberias_update" deja al dueño editar su barbería (nombre, dirección,
-- descripción, etc. — correcto, lo usa perfilBarberia.jsx). Pero también dejaba
-- cambiar is_suspended, subscription_status, mp_preapproval_id, subscription_amount
-- y subscription_next_payment: columnas que solo debe tocar el super administrador
-- (desde el panel de suscripciones) o el propio backend (al procesar el webhook de
-- Mercado Pago). Se confirmó en vivo: un dueño podía des-suspenderse a sí mismo con
-- una sola llamada a Supabase. "is_published" NO se toca aquí a propósito: el dueño
-- sí debe poder publicar su propia barbería desde perfilBarberia.jsx.
create or replace function public.prevent_barberia_business_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.is_suspended := old.is_suspended;
    new.subscription_status := old.subscription_status;
    new.mp_preapproval_id := old.mp_preapproval_id;
    new.subscription_amount := old.subscription_amount;
    new.subscription_next_payment := old.subscription_next_payment;
  end if;
  return new;
end;
$$;

drop trigger if exists barberias_prevent_business_tampering on public.barberias;
create trigger barberias_prevent_business_tampering
before update on public.barberias
for each row execute function public.prevent_barberia_business_tampering();

-- ============================================================
-- 2) Un cliente podía cambiar el precio de su propia cita
-- ============================================================
-- "appointments_client_cancel" y "appointments_staff_update" dejaban editar
-- cualquier columna de una cita (incluidos subtotal/discount_total/total), mientras
-- la fila perteneciera al cliente o a un miembro del staff. Se confirmó en vivo: un
-- cliente podía bajar el total de su propia cita de $330 a $1 con una sola llamada.
--
-- Ninguna de las dos políticas hace falta: todo el ciclo de vida de la cita (aceptar,
-- rechazar, confirmar, iniciar, completar, cancelar) ya pasa por el backend
-- (citasController.js, con la llave de servicio) — no hay ni un solo
-- ".from('appointments').update(...)" directo en el frontend. Se eliminan por
-- completo en vez de intentar acotarlas columna por columna.
drop policy if exists appointments_client_cancel on public.appointments;
drop policy if exists appointments_staff_update on public.appointments;
