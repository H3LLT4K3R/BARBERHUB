import { supabaseAdmin } from '../config/supabase.js';

// Registro de auditoría para acciones sensibles (aceptar/rechazar/confirmar citas,
// reembolsos, moderación de reseñas...). Nadie puede leer ni escribir audit_log desde
// el cliente (RLS sin políticas a propósito) — es el respaldo interno para revisar
// disputas ("quién hizo qué y cuándo"), no una función de cara al usuario.
// Best-effort: un fallo aquí nunca debe tumbar la acción principal.
export async function registrarAuditoria({ barberiaId, actorId, action, entityType, entityId, oldData, newData }) {
    const { error } = await supabaseAdmin.from('audit_log').insert({
        barberia_id: barberiaId ?? null,
        actor_id: actorId ?? null,
        action,
        entity_type: entityType,
        entity_id: entityId ?? null,
        old_data: oldData ?? null,
        new_data: newData ?? null,
    });
    if (error) console.error('No se pudo registrar en audit_log:', error.message);
}
