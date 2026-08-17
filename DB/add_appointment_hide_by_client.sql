-- Igual que hidden_by_barber_at (add_appointment_hide_and_barberia_photo.sql), pero
-- del lado del cliente: le permite quitar una cita terminal de su propio Historial sin
-- borrar el registro real (la barbería sigue viendo sus citas/pagos/reseñas para su
-- contabilidad).
alter table public.appointments add column if not exists hidden_by_client_at timestamptz;
