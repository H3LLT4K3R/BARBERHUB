-- Igual que hidden_by_barber_at / hidden_by_client_at, pero para la lista de
-- "Canceladas y rechazadas recientes" del owner en Gestión de Agenda: cada rol oculta
-- su propia vista de forma independiente, sin afectar lo que ven los demás ni borrar
-- el registro real (pagos/reseñas/reportes se conservan intactos).
alter table public.appointments add column if not exists hidden_by_owner_at timestamptz;
