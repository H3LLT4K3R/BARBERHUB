-- Hoy, un cliente con historial de citas NO puede borrar su cuenta de verdad
-- (eliminarCuenta la anonimiza en su lugar) porque appointments.client_id,
-- reviews.client_id, payments.payer_id y coupon_redemptions.client_id son
-- "on delete restrict" — Postgres bloquea el borrado del perfil mientras esas
-- filas existan. Eso es intencional para proteger la contabilidad de la
-- barbería por defecto, pero el cliente debe poder elegir "bórralo todo, me
-- da igual perder ese historial" si así lo quiere.
--
-- La solución: en vez de restrict, esas columnas pasan a "on delete set null"
-- (y se vuelven nullable). Así, si el cliente elige el borrado total, su perfil
-- se borra de verdad, sus citas/reseñas/pagos SIGUEN existiendo (la barbería no
-- pierde su registro de ingresos ni de servicios prestados), pero ya no están
-- ligados a una persona identificable. El frontend debe mostrar "Cliente
-- eliminado" donde antes mostraba el nombre, cuando estas columnas son null.

alter table public.appointments alter column client_id drop not null;
alter table public.appointments drop constraint appointments_client_id_fkey;
alter table public.appointments add constraint appointments_client_id_fkey
  foreign key (client_id) references public.profiles(id) on delete set null;

alter table public.reviews alter column client_id drop not null;
alter table public.reviews drop constraint reviews_client_id_fkey;
alter table public.reviews add constraint reviews_client_id_fkey
  foreign key (client_id) references public.profiles(id) on delete set null;

alter table public.payments alter column payer_id drop not null;
alter table public.payments drop constraint payments_payer_id_fkey;
alter table public.payments add constraint payments_payer_id_fkey
  foreign key (payer_id) references public.profiles(id) on delete set null;

alter table public.coupon_redemptions alter column client_id drop not null;
alter table public.coupon_redemptions drop constraint coupon_redemptions_client_id_fkey;
alter table public.coupon_redemptions add constraint coupon_redemptions_client_id_fkey
  foreign key (client_id) references public.profiles(id) on delete set null;
