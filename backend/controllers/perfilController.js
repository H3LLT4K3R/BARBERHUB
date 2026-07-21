import { supabaseAdmin } from '../config/supabase.js';

// El staff (barbero/admin/owner) edita solo los campos "de vitrina" de su propia
// membresía (especialidad, bio, nombre visible). barberia_memberships no tiene una
// política de auto-actualización a propósito: si se la diéramos directa por RLS,
// cualquiera podría también reescribir su propio "role" o "barberia_id" desde el
// navegador. Aquí sí se puede exponer porque solo tocamos estos tres campos.
export const actualizarPerfilMembresia = async (req, res) => {
    const { specialty, bio, displayName } = req.body;

    try {
        const { data: membership, error: fetchError } = await supabaseAdmin
            .from('barberia_memberships')
            .select('id')
            .eq('profile_id', req.user.id)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!membership) return res.status(404).json({ error: 'No perteneces a ninguna barbería activa.' });

        const cambios = {};
        if (specialty !== undefined) cambios.specialty = specialty;
        if (bio !== undefined) cambios.bio = bio;
        if (displayName !== undefined) cambios.display_name = displayName;

        if (Object.keys(cambios).length === 0) {
            return res.status(400).json({ error: 'No hay cambios que guardar.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('barberia_memberships')
            .update(cambios)
            .eq('id', membership.id);
        if (updateError) throw updateError;

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al actualizar el perfil de membresía:', error);
        res.status(500).json({ error: 'No fue posible guardar los cambios.' });
    }
};
