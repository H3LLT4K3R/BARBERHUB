-- "aprobarLink" (GET /api/aprobar/:id, sin sesión, pensado para que solo tú lo abras
-- desde el correo) usaba el propio "id" de la fila de payment_provider_accounts como
-- si fuera un secreto. Pero ese id no es secreto: solicitarLink se lo regresaba al
-- dueño en la respuesta JSON (el frontend no lo usa, pero cualquiera lo ve en la
-- pestaña Network del navegador), y además el dueño puede leerlo directo vía RLS
-- (payment_accounts_staff_read). Se confirmó en vivo con una cuenta descartable: un
-- dueño podía llamar /solicitar, tomar el id de la respuesta y llamar /aprobar/<id>
-- sin ningún token de sesión, autoaprobándose el link sin que nadie lo revisara.
--
-- La columna "id" sigue siendo el identificador normal de la fila. Se agrega una
-- columna aparte para el secreto real del link de aprobación: se guarda solo su hash
-- (igual que una contraseña), nunca el valor plano — así ni siquiera alguien con
-- acceso de lectura a esta tabla puede reconstruir el link de aprobación.
alter table public.payment_provider_accounts
  add column if not exists approval_token_hash text;

create index if not exists payment_provider_accounts_approval_token_hash_idx
  on public.payment_provider_accounts(approval_token_hash)
  where approval_token_hash is not null;
