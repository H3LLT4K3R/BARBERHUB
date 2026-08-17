import { supabaseAdmin } from '../config/supabase.js';
import { registrarAuditoria } from '../utils/auditoria.js';
import { obtenerEmailsPorId } from '../utils/usuarios.js';

const ESTADOS_ACTIVOS = ['pending_confirmation', 'pending_payment', 'confirmed', 'in_progress'];

async function esOwner(userId, barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('id')
        .eq('barberia_id', barberiaId)
        .eq('profile_id', userId)
        .eq('role', 'owner')
        .eq('is_active', true)
        .maybeSingle();
    if (error) throw error;
    return data;
}

// barberia_memberships no guarda el correo (vive en auth.users, no accesible desde el
// cliente); esta lista lo agrega para que el dueño pueda administrar sus cuentas.
export const listarEquipo = async (req, res) => {
    const { barberiaId } = req.query;
    if (!barberiaId) return res.status(400).json({ error: 'Falta barberiaId.' });

    try {
        const membership = await esOwner(req.user.id, barberiaId);
        if (!membership) return res.status(403).json({ error: 'Solo el dueño puede ver esta lista.' });

        const { data: miembros, error: fetchError } = await supabaseAdmin
            .from('barberia_memberships')
            .select('id, profile_id, role, display_name, is_active, joined_at')
            .eq('barberia_id', barberiaId)
            .neq('role', 'owner')
            .order('joined_at');
        if (fetchError) throw fetchError;

        const emailPorId = await obtenerEmailsPorId((miembros ?? []).map((m) => m.profile_id));

        res.json({
            miembros: (miembros ?? []).map((m) => ({ ...m, email: emailPorId.get(m.profile_id) ?? null })),
        });
    } catch (error) {
        console.error('Error al listar el equipo:', error);
        res.status(500).json({ error: 'No fue posible cargar el equipo.' });
    }
};

// Solo el owner (no admin) puede crear cuentas nuevas de staff — mismo límite que ya
// impone owner_memberships_manage en barberia_memberships.
export const crearCuentaStaff = async (req, res) => {
    const { barberiaId, fullName, email, password, role } = req.body;

    if (!barberiaId || !fullName || !email || !password || !role) {
        return res.status(400).json({ error: 'Faltan barberiaId, fullName, email, password o role.' });
    }
    if (!['barber', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'role debe ser "barber" o "admin".' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        const membership = await esOwner(req.user.id, barberiaId);
        if (!membership) return res.status(403).json({ error: 'Solo el dueño puede crear cuentas.' });

        const { data: nuevoUsuario, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName },
        });
        if (createError) {
            if (createError.message?.includes('already registered')) {
                // Un barbero/administrador solo puede pertenecer a una barbería: si el correo ya
                // tiene cuenta (en esta u otra barbería), no se reutiliza, se rechaza.
                return res.status(409).json({ error: 'Ya existe una cuenta con ese correo. Un barbero o administrador solo puede pertenecer a una barbería, así que no se puede reutilizar un correo ya registrado.' });
            }
            throw createError;
        }

        // El trigger on_auth_user_created ya creó profiles; ahora la membresía en esta barbería.
        const { data: nuevaMembresia, error: membershipError } = await supabaseAdmin
            .from('barberia_memberships')
            .insert({ barberia_id: barberiaId, profile_id: nuevoUsuario.user.id, role, display_name: fullName })
            .select('id, role, is_active')
            .single();
        if (membershipError) {
            await supabaseAdmin.auth.admin.deleteUser(nuevoUsuario.user.id);
            throw membershipError;
        }

        // El horario individual del barbero arranca igual al horario general de la barbería
        // (el owner ya lo configuró en Perfil Barbería); el barbero lo puede ajustar después
        // desde su propio Perfil Barbero.
        if (role === 'barber') {
            const { data: horarioBarberia } = await supabaseAdmin
                .from('business_hours')
                .select('weekday, opens_at, closes_at, is_closed')
                .eq('barberia_id', barberiaId);

            const diasAbiertos = (horarioBarberia ?? []).filter((h) => !h.is_closed);
            if (diasAbiertos.length) {
                await supabaseAdmin.from('staff_availability').insert(
                    diasAbiertos.map((h) => ({
                        membership_id: nuevaMembresia.id,
                        weekday: h.weekday,
                        starts_at: h.opens_at,
                        ends_at: h.closes_at,
                    }))
                );
            }
        }

        await registrarAuditoria({
            barberiaId,
            actorId: req.user.id,
            action: 'team.create',
            entityType: 'barberia_membership',
            entityId: nuevaMembresia.id,
            newData: { email, role },
        });

        res.status(201).json({ membership: nuevaMembresia, profile: { id: nuevoUsuario.user.id, full_name: fullName, email } });
    } catch (error) {
        console.error('Error al crear cuenta de staff:', error);
        res.status(500).json({ error: 'No fue posible crear la cuenta.' });
    }
};

// El owner restablece la contraseña de un miembro de su equipo.
export const restablecerPasswordStaff = async (req, res) => {
    const { password } = req.body;
    const { membershipId } = req.params;

    if (!password || password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        const { data: membership, error: fetchError } = await supabaseAdmin
            .from('barberia_memberships')
            .select('id, barberia_id, profile_id')
            .eq('id', membershipId)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!membership) return res.status(404).json({ error: 'Cuenta no encontrada.' });

        const esDuenio = await esOwner(req.user.id, membership.barberia_id);
        if (!esDuenio) return res.status(403).json({ error: 'Solo el dueño puede restablecer contraseñas.' });

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(membership.profile_id, { password });
        if (updateError) throw updateError;

        await registrarAuditoria({
            barberiaId: membership.barberia_id,
            actorId: req.user.id,
            action: 'team.reset_password',
            entityType: 'barberia_membership',
            entityId: membership.id,
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({ error: 'No fue posible restablecer la contraseña.' });
    }
};

// El owner activa/desactiva a un miembro de su equipo. Antes esto era un update directo
// desde el frontend a barberia_memberships (RLS ya se lo permitía al owner), pero se
// mueve aquí porque también hay que tocar profiles.is_active — RLS de profiles solo deja
// a cada quien editar su propia fila (profiles_self), así que un owner nunca podría
// hacerlo directo desde el navegador. Mientras esté desactivado, profiles.is_active=false
// bloquea también su acceso como cliente (ver login.jsx), no solo su panel de staff.
export const alternarActivoStaff = async (req, res) => {
    const { membershipId } = req.params;
    const { activar } = req.body;

    if (typeof activar !== 'boolean') {
        return res.status(400).json({ error: 'Falta activar (true/false).' });
    }

    try {
        const { data: membership, error: fetchError } = await supabaseAdmin
            .from('barberia_memberships')
            .select('id, barberia_id, profile_id, is_active')
            .eq('id', membershipId)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!membership) return res.status(404).json({ error: 'Cuenta no encontrada.' });

        const esDuenio = await esOwner(req.user.id, membership.barberia_id);
        if (!esDuenio) return res.status(403).json({ error: 'Solo el dueño puede activar/desactivar cuentas.' });

        const { error: membershipError } = await supabaseAdmin
            .from('barberia_memberships')
            .update({ is_active: activar })
            .eq('id', membership.id);
        if (membershipError) throw membershipError;

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ is_active: activar })
            .eq('id', membership.profile_id);
        if (profileError) throw profileError;

        await registrarAuditoria({
            barberiaId: membership.barberia_id,
            actorId: req.user.id,
            action: activar ? 'team.activate' : 'team.deactivate',
            entityType: 'barberia_membership',
            entityId: membership.id,
            oldData: { is_active: membership.is_active },
            newData: { is_active: activar },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al activar/desactivar la cuenta:', error);
        res.status(500).json({ error: 'No fue posible actualizar la cuenta.' });
    }
};

// El owner elimina a un miembro de su equipo que ya no trabaja ahí: se borra por
// completo (barberia_memberships y la cuenta de auth.users en cascada arrastra
// profiles, notificaciones, etc.), sin dejar rastro ni reservar su correo. Sus citas
// pasadas se conservan para la contabilidad de la barbería (appointments.barber_membership_id
// queda en null, ver DB/add_appointments_barber_membership_set_null.sql), pero ya sin
// ninguna cuenta ligada a ellas.
export const eliminarCuentaStaff = async (req, res) => {
    const { membershipId } = req.params;

    try {
        const { data: membership, error: fetchError } = await supabaseAdmin
            .from('barberia_memberships')
            .select('id, barberia_id, profile_id, display_name')
            .eq('id', membershipId)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!membership) return res.status(404).json({ error: 'Cuenta no encontrada.' });

        const esDuenio = await esOwner(req.user.id, membership.barberia_id);
        if (!esDuenio) return res.status(403).json({ error: 'Solo el dueño puede eliminar cuentas.' });

        const { count: citasFuturas, error: countError } = await supabaseAdmin
            .from('appointments')
            .select('id', { count: 'exact', head: true })
            .eq('barber_membership_id', membership.id)
            .in('status', ESTADOS_ACTIVOS)
            .gte('scheduled_at', new Date().toISOString());
        if (countError) throw countError;
        if (citasFuturas > 0) {
            return res.status(409).json({ error: `Tiene ${citasFuturas} cita(s) próxima(s) asignada(s). Reasígnalas o cancélalas antes de eliminarlo.` });
        }

        const { error: deleteError } = await supabaseAdmin
            .from('barberia_memberships')
            .delete()
            .eq('id', membership.id);
        if (deleteError) throw deleteError;

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(membership.profile_id);
        if (authError) throw authError;

        await registrarAuditoria({
            barberiaId: membership.barberia_id,
            actorId: req.user.id,
            action: 'team.remove',
            entityType: 'barberia_membership',
            entityId: membership.id,
            oldData: { display_name: membership.display_name },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al eliminar la cuenta:', error);
        res.status(500).json({ error: 'No fue posible eliminar la cuenta.' });
    }
};
