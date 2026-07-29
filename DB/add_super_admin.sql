alter table public.profiles add column is_super_admin boolean not null default false;

-- Marca como super admin la cuenta con este correo (cámbialo por el que quieras usar).
update public.profiles
set is_super_admin = true
where id = (select id from auth.users where email = 'owner@prueba.com');
