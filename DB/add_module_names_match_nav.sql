-- Los nombres de platform_modules no coincidían con las etiquetas reales que ve el
-- dueño/administrador/barbero en su propio menú lateral, lo que hacía confuso saber
-- qué switch de Seguridad corresponde a qué pantalla.
update public.platform_modules set name = 'Gestión de Agenda' where code = 'agenda';
update public.platform_modules set name = 'Inventario (Stock)' where code = 'inventario';
