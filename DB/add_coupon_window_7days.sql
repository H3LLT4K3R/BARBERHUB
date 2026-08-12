-- Ajuste del plazo personal de canje: 7 días (no 5), aviso de recordatorio en el día 5.
alter table public.coupons alter column redemption_window_days set default 7;

-- Actualiza también los cupones ya creados que quedaron con el valor anterior (5).
update public.coupons set redemption_window_days = 7 where redemption_window_days = 5;
