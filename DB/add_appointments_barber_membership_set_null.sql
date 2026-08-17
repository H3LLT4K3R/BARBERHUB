-- Permite borrar por completo la cuenta de un barbero (auth.users + profiles +
-- barberia_memberships) aunque ya tenga citas en su historial. Antes
-- appointments.barber_membership_id tenía "on delete restrict", que bloqueaba el borrado
-- de la membresía si tenía aunque sea una cita pasada — forzando a solo anonimizar en
-- vez de borrar de verdad. Se cambia a "on delete set null" (mismo criterio que ya usa
-- reviews.barber_membership_id): la cita y su información financiera se conservan para
-- la contabilidad de la barbería, pero deja de estar ligada a un barbero en particular.
do $$
declare
  nombre_constraint text;
begin
  select conname into nombre_constraint
  from pg_constraint
  where conrelid = 'public.appointments'::regclass
    and confrelid = 'public.barberia_memberships'::regclass
    and contype = 'f';

  execute format('alter table public.appointments drop constraint %I', nombre_constraint);
  execute 'alter table public.appointments add constraint appointments_barber_membership_id_fkey foreign key (barber_membership_id) references public.barberia_memberships(id) on delete set null';
end $$;
