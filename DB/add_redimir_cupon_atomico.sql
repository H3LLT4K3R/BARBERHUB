-- Condición de carrera en cupones: validarCupon() cuenta cuántas veces se usó un
-- cupón (usage_limit global, per_client_limit por cliente) y crearCita() inserta el
-- canje en coupon_redemptions como un paso APARTE, sin ninguna transacción ni bloqueo
-- de por medio. Si alguien manda varias solicitudes de reserva en paralelo con el
-- mismo código, todas pueden pasar el conteo "todavía no llegas al límite" al mismo
-- tiempo, antes de que cualquiera se registre — un cupón con usage_limit=10 podría
-- terminar usándose muchas más veces de las previstas.
--
-- Esta función hace el chequeo Y el insert en una sola transacción, bloqueando la
-- fila del cupón (`for update`) mientras dura: cualquier otra solicitud concurrente
-- para el MISMO cupón espera a que esta termine antes de hacer su propio conteo, así
-- que ya no hay ventana para que dos solicitudes se cuelen a la vez.
create or replace function public.redimir_cupon(
  p_coupon_id uuid,
  p_client_id uuid,
  p_appointment_id uuid,
  p_discount_amount numeric
) returns public.coupon_redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage_limit integer;
  v_per_client_limit integer;
  v_total_count integer;
  v_client_count integer;
  v_redemption public.coupon_redemptions;
begin
  select usage_limit, per_client_limit
  into v_usage_limit, v_per_client_limit
  from public.coupons
  where id = p_coupon_id
  for update;

  if not found then
    raise exception 'coupon_not_found';
  end if;

  if v_usage_limit is not null then
    select count(*) into v_total_count from public.coupon_redemptions where coupon_id = p_coupon_id;
    if v_total_count >= v_usage_limit then
      raise exception 'coupon_usage_limit_reached';
    end if;
  end if;

  select count(*) into v_client_count
  from public.coupon_redemptions
  where coupon_id = p_coupon_id and client_id = p_client_id;
  if v_client_count >= v_per_client_limit then
    raise exception 'coupon_client_limit_reached';
  end if;

  insert into public.coupon_redemptions (coupon_id, appointment_id, client_id, discount_amount)
  values (p_coupon_id, p_appointment_id, p_client_id, p_discount_amount)
  returning * into v_redemption;

  return v_redemption;
end;
$$;
