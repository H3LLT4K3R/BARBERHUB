-- Coordenadas de cada ciudad, para que el mapa de Explorar pueda centrarse en la
-- ciudad/zona elegida en el filtro aunque todavía no haya ninguna barbería ahí
-- (hasta ahora el mapa solo reaccionaba a los marcadores de barberías ya existentes).
alter table public.ciudades add column if not exists lat double precision;
alter table public.ciudades add column if not exists lng double precision;
