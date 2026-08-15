import { supabaseAdmin } from '../config/supabase.js';
import { registrarAuditoria } from '../utils/auditoria.js';

// El dueño desde Seguridad de la Plataforma puede apagarle a un admin el acceso a un
// módulo (ver DB/add_module_permissions_enforcement.sql); esto lo hace valer también
// en el backend. El dueño nunca se restringe a sí mismo, y si a alguien aún no se le
// configuró ningún permiso tiene acceso completo.
async function tieneAccesoModulo(userId, barberiaId, moduleCode) {
    const { data, error } = await supabaseAdmin.rpc('has_module_access', {
        p_barberia_id: barberiaId,
        p_module_code: moduleCode,
        p_need_manage: true,
        p_profile_id: userId,
    });
    if (error) throw error;
    return data === true;
}

async function esOwnerOAdmin(userId, barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('id')
        .eq('barberia_id', barberiaId)
        .eq('profile_id', userId)
        .in('role', ['owner', 'admin'])
        .eq('is_active', true)
        .maybeSingle();
    if (error) throw error;
    return data;
}

// El dueño/admin oculta o vuelve a mostrar una reseña (moderación, no borrado).
export const moderarResena = async (req, res) => {
    const { publicar } = req.body;
    if (typeof publicar !== 'boolean') {
        return res.status(400).json({ error: 'Falta publicar (true/false).' });
    }

    try {
        const { data: review, error: fetchError } = await supabaseAdmin
            .from('reviews')
            .select('id, barberia_id')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!review) return res.status(404).json({ error: 'Reseña no encontrada.' });

        const membership = await esOwnerOAdmin(req.user.id, review.barberia_id);
        if (!membership) return res.status(403).json({ error: 'No tienes permiso sobre esta barbería.' });
        if (!(await tieneAccesoModulo(req.user.id, review.barberia_id, 'opiniones'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Opiniones.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('reviews')
            .update({ is_published: publicar })
            .eq('id', review.id);
        if (updateError) throw updateError;

        await registrarAuditoria({
            barberiaId: review.barberia_id,
            actorId: req.user.id,
            action: publicar ? 'review.publish' : 'review.hide',
            entityType: 'review',
            entityId: review.id,
            newData: { is_published: publicar },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al moderar la reseña:', error);
        res.status(500).json({ error: 'No fue posible actualizar la reseña.' });
    }
};

// El super admin marca una reseña como destacada para mostrarla en el landing público
// (curaduría centralizada: los dueños ya no pueden destacar sus propias reseñas).
export const destacarResena = async (req, res) => {
    const { destacar } = req.body;
    if (typeof destacar !== 'boolean') {
        return res.status(400).json({ error: 'Falta destacar (true/false).' });
    }

    try {
        const { data: review, error: fetchError } = await supabaseAdmin
            .from('reviews')
            .select('id, barberia_id')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!review) return res.status(404).json({ error: 'Reseña no encontrada.' });

        const { error: updateError } = await supabaseAdmin
            .from('reviews')
            .update({ is_featured: destacar })
            .eq('id', review.id);
        if (updateError) throw updateError;

        await registrarAuditoria({
            barberiaId: review.barberia_id,
            actorId: req.user.id,
            action: destacar ? 'review.feature' : 'review.unfeature',
            entityType: 'review',
            entityId: review.id,
            newData: { is_featured: destacar },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al destacar la reseña:', error);
        res.status(500).json({ error: 'No fue posible actualizar la reseña.' });
    }
};
