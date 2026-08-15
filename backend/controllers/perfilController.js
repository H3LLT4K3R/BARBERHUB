import { supabaseAdmin } from '../config/supabase.js';

const ESTADOS_ACTIVOS = ['pending_confirmation', 'pending_payment', 'confirmed', 'in_progress'];

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

// Autoservicio de cliente: elimina su propia cuenta.
// - Sin historial de citas: siempre se borra por completo (auth.users en
//   cascada arrastra profiles, favoritos, notificaciones, etc.).
// - Con historial: por defecto se anonimiza (se borran datos personales, se
//   desactiva el acceso, pero la fila y sus citas/pagos/reseñas quedan para
//   no perder la contabilidad de la barbería). Si el cliente manda
//   `borrarTodo: true` explícitamente, se le respeta y se borra la cuenta de
//   verdad de todas formas — sus citas/pagos/reseñas pasadas se quedan (la
//   barbería no pierde su registro), pero dejan de estar ligadas a su nombre
//   (appointments.client_id, reviews.client_id, payments.payer_id y
//   coupon_redemptions.client_id quedan en null, ver
//   DB/add_client_full_delete_option.sql).
export const eliminarCuenta = async (req, res) => {
    const profileId = req.user.id;
    const borrarTodo = req.body?.borrarTodo === true;

    try {
        const { data: membership } = await supabaseAdmin
            .from('barberia_memberships')
            .select('id')
            .eq('profile_id', profileId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
        if (membership) {
            return res.status(400).json({ error: 'Tu cuenta administra o forma parte de una barbería. Contacta a soporte para eliminarla.' });
        }

        const { count: totalCitas, error: countError } = await supabaseAdmin
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', profileId);
        if (countError) throw countError;

        if (!totalCitas || borrarTodo) {
            // Los puntos de fidelidad son personales (no le sirven a la barbería sin el
            // cliente detrás), así que se borran de verdad en vez de reasignarse — a
            // diferencia de citas/pagos/reseñas, que sí se conservan por su valor contable.
            await supabaseAdmin.from('loyalty_ledger').delete().eq('profile_id', profileId);
            await supabaseAdmin.from('loyalty_accounts').delete().eq('profile_id', profileId);

            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profileId);
            if (deleteError) throw deleteError;
            return res.json({ ok: true, borradoTotal: true });
        }

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ full_name: 'Usuario eliminado', phone: null, avatar_path: null, is_active: false })
            .eq('id', profileId);
        if (updateError) throw updateError;

        res.json({ ok: true, borradoTotal: false });
    } catch (error) {
        console.error('Error al eliminar la cuenta:', error);
        res.status(500).json({ error: 'No fue posible eliminar la cuenta.' });
    }
};

// Autoservicio de barbero: desactiva su propia membresía.
// - Sin citas futuras activas asignadas: se desactiva de inmediato (no se borra
//   nada, solo deja de estar disponible y de poder entrar como barbero).
// - Con citas futuras: no se toca su membresía — se le avisa al owner/admin
//   para que las reasigne o cancele primero y lo desactive él mismo desde su
//   panel de Usuarios (donde ya puede hacerlo). barberia_memberships no tiene
//   política de auto-actualización a propósito (ver actualizarPerfilMembresia),
//   así que esto siempre pasa por aquí, nunca directo desde el frontend.
export const desactivarMiMembresia = async (req, res) => {
    const profileId = req.user.id;

    try {
        const { data: membership, error: membershipError } = await supabaseAdmin
            .from('barberia_memberships')
            .select('id, barberia_id, display_name')
            .eq('profile_id', profileId)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
        if (membershipError) throw membershipError;
        if (!membership) return res.status(404).json({ error: 'No perteneces a ninguna barbería activa.' });

        const { count: citasFuturas, error: countError } = await supabaseAdmin
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('barber_membership_id', membership.id)
            .in('status', ESTADOS_ACTIVOS)
            .gte('scheduled_at', new Date().toISOString());
        if (countError) throw countError;

        const { data: perfil } = await supabaseAdmin.from('profiles').select('full_name').eq('id', profileId).maybeSingle();
        const nombreBarbero = perfil?.full_name || membership.display_name || 'Un barbero';

        const { data: dueños, error: dueñosError } = await supabaseAdmin
            .from('barberia_memberships')
            .select('profile_id')
            .eq('barberia_id', membership.barberia_id)
            .in('role', ['owner', 'admin'])
            .eq('is_active', true);
        if (dueñosError) throw dueñosError;

        if (citasFuturas > 0) {
            const filas = (dueños ?? []).map((m) => ({
                profile_id: m.profile_id,
                type: 'system',
                title: 'Solicitud de baja de un barbero',
                body: `${nombreBarbero} quiere desactivar su cuenta, pero tiene ${citasFuturas} cita(s) próxima(s) asignada(s). Reasígnalas o cancélalas antes de desactivarlo desde Usuarios.`,
                action_url: '/owner-usuarios',
                data: { membershipId: membership.id },
            }));
            if (filas.length) {
                const { error: notifError } = await supabaseAdmin.from('notifications').insert(filas);
                if (notifError) console.error('No se pudo notificar al owner:', notifError.message);
            }
            return res.json({ ok: true, desactivado: false, citasPendientes: citasFuturas });
        }

        const { error: updateError } = await supabaseAdmin
            .from('barberia_memberships')
            .update({ is_active: false })
            .eq('id', membership.id);
        if (updateError) throw updateError;

        const filas = (dueños ?? []).map((m) => ({
            profile_id: m.profile_id,
            type: 'system',
            title: 'Un barbero desactivó su cuenta',
            body: `${nombreBarbero} desactivó su propia cuenta. Ya no aparecerá disponible para nuevas citas.`,
            action_url: '/owner-usuarios',
            data: { membershipId: membership.id },
        }));
        if (filas.length) {
            const { error: notifError } = await supabaseAdmin.from('notifications').insert(filas);
            if (notifError) console.error('No se pudo notificar al owner:', notifError.message);
        }

        res.json({ ok: true, desactivado: true });
    } catch (error) {
        console.error('Error al desactivar la membresía:', error);
        res.status(500).json({ error: 'No fue posible desactivar tu cuenta.' });
    }
};
