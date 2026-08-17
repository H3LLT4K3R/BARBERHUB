-- Comentario aparte para el barbero, igual que ya se separó la calificación
-- (barber_rating). "comment" se queda como el comentario sobre la barbería.
alter table public.reviews add column if not exists barber_comment text check (char_length(barber_comment) <= 2000);
