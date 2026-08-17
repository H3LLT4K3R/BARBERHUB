-- "Recordatorio de cita" (ajustes.jsx) no tenía ninguna función real detrás: no existía
-- ningún cron que mandara un recordatorio antes de la cita. Esta columna evita mandar el
-- mismo recordatorio dos veces, igual que coupon_claims.reminder_sent_at.
alter table public.appointments add column if not exists reminder_sent_at timestamptz;
