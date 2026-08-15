-- add_client_full_delete_option.sql cambió reviews.client_id a "on delete set null",
-- pero se topó con un trigger que no se había considerado: reviews_validate_scope
-- corre "before insert OR UPDATE" (sin restringir a columnas específicas), así que
-- también se dispara cuando Postgres pone reviews.client_id en null por la cascada
-- del borrado del cliente — y como el chequeo compara "a.client_id = new.client_id"
-- (que nunca es cierto contra null), la validación rechazaba esa actualización y
-- bloqueaba el borrado completo de la cuenta. Se confirmó en vivo con una cuenta de
-- prueba real antes de este fix (error "Reviews require a completed appointment
-- belonging to the client").
--
-- La validación de que una reseña pertenezca a una cita completada del cliente sigue
-- aplicando normal para reseñas nuevas (insert) o editadas por el propio cliente
-- (update con client_id real) — el único caso que ahora se deja pasar es cuando
-- client_id llega en null, que solo puede pasar por la cascada del sistema, nunca
-- por una petición normal del frontend (siempre manda su propio auth.uid()).
create or replace function public.validate_review_scope() returns trigger language plpgsql as $$
begin
  if new.client_id is null then
    return new;
  end if;
  if not exists (
    select 1 from public.appointments a where a.id = new.appointment_id and a.client_id = new.client_id and a.barberia_id = new.barberia_id and a.status = 'completed' and (new.barber_membership_id is null or new.barber_membership_id = a.barber_membership_id)
  ) then raise exception 'Reviews require a completed appointment belonging to the client'; end if;
  return new;
end $$;
