import { supabaseAdmin } from '../config/supabase.js';
import { registrarAuditoria } from '../utils/auditoria.js';
import { obtenerEmailsPorId } from '../utils/usuarios.js';

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
