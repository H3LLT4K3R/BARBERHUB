-- appointments_no_barber_overlap (ver supabase-schema-production.sql) solo protege
-- citas con barber_membership_id específico: su cláusula WHERE excluye explícitamente
-- las citas "sin preferencia" (barber_membership_id is null). Eso deja una ventana de
-- doble reserva real: dos clientes pueden pedir disponibilidad para el mismo horario
-- "sin preferencia", ambos ven el horario libre, y ambos POST /citas casi al mismo
-- tiempo — como el INSERT nunca choca contra ninguna restricción, los dos se crean.
-- Confirmado en vivo: dos POST /citas en paralelo para el mismo horario, las dos
-- devolvieron 201.
--
-- No es un caso hipotético: obtenerDisponibilidad ya trata "sin preferencia" como
-- ocupado en cuanto existe CUALQUIER cita bloqueante en ese rango horario (no filtra
-- por barbero cuando no se pidió uno — ver citasController.js), así que el propio
-- sistema ya asume que un horario "sin preferencia" solo puede tener una cita a la
-- vez. Esta restricción simplemente lo hace valer también a nivel de base de datos,
-- igual que appointments_no_barber_overlap lo hace para un barbero específico.
--
-- No se puede usar la expresión tstzrange(scheduled_at, scheduled_at + duration_minutes
-- * interval '1 minute', '[)') directo dentro del índice: el operador timestamptz + interval
-- está marcado STABLE (no IMMUTABLE) en Postgres, así que un CREATE/ALTER nuevo lo
-- rechaza con "functions in index expression must be marked IMMUTABLE" (a diferencia
-- de appointments_no_barber_overlap, que ya existe desde antes con esa misma expresión).
-- El arreglo estándar es envolver el cálculo en una función marcada IMMUTABLE — es seguro
-- porque duration_minutes solo aporta minutos (nunca meses/días), que es justo el
-- componente que hace que timestamptz + interval dependa de la zona horaria.
create or replace function public.appointment_time_range(p_scheduled_at timestamptz, p_duration_minutes integer)
returns tstzrange
language sql
immutable
as $$
  select tstzrange(p_scheduled_at, p_scheduled_at + make_interval(mins => p_duration_minutes), '[)');
$$;

alter table public.appointments add constraint appointments_no_preference_overlap exclude using gist (
  barberia_id with =,
  public.appointment_time_range(scheduled_at, duration_minutes) with &&
) where (barber_membership_id is null and status in ('pending_confirmation', 'confirmed', 'in_progress'));
