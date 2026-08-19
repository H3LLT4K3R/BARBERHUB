-- appointments_no_barber_overlap (ver supabase-schema-production.sql) solo protege
-- citas con barber_membership_id específico: su cláusula WHERE excluye explícitamente
-- las citas "sin preferencia" (barber_membership_id is null). Eso deja una ventana de
-- doble reserva real: dos clientes pueden pedir disponibilidad para el mismo horario
-- "sin preferencia", ambos ven el horario libre, y ambos POST /citas casi al mismo
-- tiempo — como el INSERT nunca choca contra ninguna restricción, los dos se crean.
--
-- No es un caso hipotético: obtenerDisponibilidad ya trata "sin preferencia" como
-- ocupado en cuanto existe CUALQUIER cita bloqueante en ese rango horario (no filtra
-- por barbero cuando no se pidió uno — ver citasController.js), así que el propio
-- sistema ya asume que un horario "sin preferencia" solo puede tener una cita a la
-- vez. Esta restricción simplemente lo hace valer también a nivel de base de datos,
-- igual que appointments_no_barber_overlap lo hace para un barbero específico.
alter table public.appointments add constraint appointments_no_preference_overlap exclude using gist (
  barberia_id with =,
  tstzrange(scheduled_at, scheduled_at + duration_minutes * interval '1 minute', '[)') with &&
) where (barber_membership_id is null and status in ('pending_confirmation', 'confirmed', 'in_progress'));
