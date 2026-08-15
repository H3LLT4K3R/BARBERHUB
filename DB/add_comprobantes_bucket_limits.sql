-- El bucket "comprobantes" se creó sin file_size_limit ni allowed_mime_types (a
-- diferencia de "perfiles", que sí los tiene). El frontend valida tipo de archivo
-- (solo imágenes) y tamaño (máx 5 MB) antes de subir, pero eso es solo del lado del
-- cliente — cualquiera puede llamar directo a la API de Storage con su propia sesión
-- y subir cualquier archivo de cualquier tamaño como "comprobante". Se agregan los
-- mismos límites aquí, del lado del servidor.
update storage.buckets
set file_size_limit = 5000000, -- 5 MB, igual que el chequeo del frontend
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'comprobantes';
