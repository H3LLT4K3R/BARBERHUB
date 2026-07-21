import { supabaseAdmin } from '../config/supabase.js';
import { registrarAuditoria } from '../utils/auditoria.js';

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

// El dueño/admin responde públicamente a una reseña.
export const responderResena = async (req, res) => {
    const { respuesta } = req.body;
    if (!respuesta?.trim()) {
        return res.status(400).json({ error: 'Falta el texto de la respuesta.' });
    }

    try {
        const { data: review, error: fetchError } = await supabaseAdmin
            .from('reviews')
            .select('id, barberia_id, client_id')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!review) return res.status(404).json({ error: 'Reseña no encontrada.' });

        const membership = await esOwnerOAdmin(req.user.id, review.barberia_id);
        if (!membership) return res.status(403).json({ error: 'No tienes permiso sobre esta barbería.' });

        const { error: updateError } = await supabaseAdmin
            .from('reviews')
            .update({ owner_response: respuesta.trim(), owner_response_at: new Date().toISOString() })
            .eq('id', review.id);
        if (updateError) throw updateError;

        await supabaseAdmin.from('notifications').insert({
            profile_id: review.client_id,
            type: 'review',
            title: 'La barbería respondió tu reseña',
            body: 'Entra a ver la respuesta que te dejaron.',
            action_url: '/opinion-barberia-general',
            data: { reviewId: review.id },
        });

        await registrarAuditoria({
            barberiaId: review.barberia_id,
            actorId: req.user.id,
            action: 'review.respond',
            entityType: 'review',
            entityId: review.id,
            newData: { owner_response: respuesta.trim() },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al responder la reseña:', error);
        res.status(500).json({ error: 'No fue posible responder la reseña.' });
    }
};

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
