-- Conecta el switch "Nuevas opiniones" de Ajustes del barbero: hasta ahora se
-- guardaba en barber_notification_preferences.review_alerts pero nada lo leía, porque
-- las reseñas se insertan directo desde el frontend (RLS) y no pasan por un controller
-- del backend donde enganchar el aviso. Un trigger en la propia tabla reviews funciona
-- sin importar desde dónde se inserte.
create or replace function public.notificar_nueva_opinion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.barber_membership_id is not null then
    insert into public.notifications (profile_id, type, title, body, action_url, data)
    select
      m.profile_id,
      'review',
      'Nueva opinión de un cliente',
      'Un cliente te calificó con ' || coalesce(new.barber_rating, new.rating)::text || ' estrellas.',
      '/barbero/opiniones',
      jsonb_build_object('reviewId', new.id)
    from public.barberia_memberships m
    left join public.barber_notification_preferences p on p.membership_id = m.id
    where m.id = new.barber_membership_id
      and m.is_active
      and coalesce(p.review_alerts, true);
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_notify_barber on public.reviews;
create trigger reviews_notify_barber
after insert on public.reviews
for each row execute function public.notificar_nueva_opinion();
