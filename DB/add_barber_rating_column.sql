-- reviews ya guarda barber_membership_id (a qué barbero corresponde la reseña), pero
-- solo tenía una calificación (rating) para la barbería en general. Se agrega una
-- calificación aparte para el barbero específico que atendió, opcional (queda en null
-- si la cita no tuvo un barbero asignado).
alter table public.reviews add column if not exists barber_rating smallint;
alter table public.reviews add constraint reviews_barber_rating_check check (barber_rating is null or barber_rating between 1 and 5);
