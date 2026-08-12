-- CRÍTICO: cualquier owner/admin podía volver su propio cupón "de plataforma".
--
-- coupons_manage (ya existente) deja a un owner/admin insertar y actualizar cupones de
-- SU PROPIA barbería (correcto, lo usa crearCupon.jsx) — pero RLS solo controla QUÉ FILA
-- se puede tocar, no qué columnas. La constraint "coupons_barberia_scope" (de
-- add_coupon_rules.sql) solo exige que is_platform_wide=true O barberia_id no sea nulo,
-- no que sean excluyentes: un owner podía dejar su barberia_id intacto Y poner
-- is_platform_wide=true en el mismo insert/update, y ese cupón pasaba a aplicar en
-- CUALQUIER barbería de la plataforma (ver el filtro .or() en utils/cupones.js) — el
-- descuento lo terminaría pagando la barbería ajena donde se use, no la que lo creó.
--
-- Mismo patrón que prevent_profile_privilege_escalation / prevent_barberia_business_
-- tampering: el trigger deja pasar sin tocar cualquier cambio que venga del backend
-- (auth.role() = 'service_role'); si viene de un usuario normal, is_platform_wide se
-- fuerza a false (en insert) o a su valor anterior (en update), sin importar qué haya
-- mandado la petición. Los cupones de plataforma (bienvenida, etc.) solo los podrá
-- crear el backend con la llave de servicio.
create or replace function public.prevent_coupon_platform_wide_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then
      new.is_platform_wide := false;
    else
      new.is_platform_wide := old.is_platform_wide;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists coupons_prevent_platform_wide_tampering on public.coupons;
create trigger coupons_prevent_platform_wide_tampering
before insert or update on public.coupons
for each row execute function public.prevent_coupon_platform_wide_tampering();
