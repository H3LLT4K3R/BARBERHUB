import { supabaseAdmin } from '../config/supabase.js';

function slugify(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Lista todas las barberías con el nombre/correo de su dueño (si ya tiene uno).
export const listarBarberias = async (req, res) => {
    try {
        const { data: barberias, error } = await supabaseAdmin
            .from('barberias')
            .select('id, name, city, state, zone, is_published, is_suspended, subscription_status, subscription_amount, created_at')
            .order('created_at', { ascending: false });
        if (error) throw error;

        const { data: memberships } = await supabaseAdmin
            .from('barberia_memberships')
            .select('barberia_id, profile_id, display_name')
            .eq('role', 'owner')
            .in('barberia_id', (barberias ?? []).map((b) => b.id));

        const { data: usuarios } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
        const emailPorId = new Map((usuarios?.users ?? []).map((u) => [u.id, u.email]));

        const duenioPorBarberia = new Map((memberships ?? []).map((m) => [m.barberia_id, m]));

        res.json({
            barberias: (barberias ?? []).map((b) => {
                const duenio = duenioPorBarberia.get(b.id);
                return {
                    ...b,
                    duenio: duenio
                        ? { nombre: duenio.display_name, email: emailPorId.get(duenio.profile_id) ?? null }
                        : null,
                };
            }),
        });
    } catch (error) {
        console.error('Error al listar barberías:', error);
        res.status(500).json({ error: 'No fue posible cargar las barberías.' });
    }
};

// Lista todas las reseñas de la plataforma (de cualquier barbería) para que el super admin
// elija cuáles destacar en el landing page, ordenadas de peor a mejor calificación.
export const listarResenas = async (req, res) => {
    try {
        const { data: resenas, error } = await supabaseAdmin
            .from('reviews')
            .select('id, rating, comment, owner_response, is_published, is_featured, created_at, barberia_id, barberias(name), profiles!client_id(full_name)')
            .order('rating', { ascending: true })
            .order('created_at', { ascending: false });
        if (error) throw error;

        res.json({ resenas: resenas ?? [] });
    } catch (error) {
        console.error('Error al listar reseñas:', error);
        res.status(500).json({ error: 'No fue posible cargar las reseñas.' });
    }
};

// Borra por completo una barbería (por ejemplo, por falta de pago prolongada): todos sus
// datos y las cuentas de su dueño/equipo. Es irreversible, por eso es acción exclusiva del
// super admin y el frontend debe pedir confirmación explícita antes de llamarla.
export const eliminarBarberia = async (req, res) => {
    const { barberiaId } = req.params;

    try {
        const { data: barberia, error: fetchError } = await supabaseAdmin
            .from('barberias')
            .select('id, name')
            .eq('id', barberiaId)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!barberia) return res.status(404).json({ error: 'Barbería no encontrada.' });

        const { data: memberships } = await supabaseAdmin
            .from('barberia_memberships')
            .select('id, profile_id')
            .eq('barberia_id', barberiaId);
        const membershipIds = (memberships ?? []).map((m) => m.id);
        const profileIds = (memberships ?? []).map((m) => m.profile_id);

        const { data: appointments } = await supabaseAdmin
            .from('appointments')
            .select('id')
            .eq('barberia_id', barberiaId);
        const appointmentIds = (appointments ?? []).map((a) => a.id);

        if (appointmentIds.length) {
            const { data: coupons } = await supabaseAdmin.from('coupons').select('id').eq('barberia_id', barberiaId);
            const couponIds = (coupons ?? []).map((c) => c.id);
            if (couponIds.length) await supabaseAdmin.from('coupon_redemptions').delete().in('coupon_id', couponIds);
            await supabaseAdmin.from('appointment_services').delete().in('appointment_id', appointmentIds);
            await supabaseAdmin.from('payments').delete().in('appointment_id', appointmentIds);
            await supabaseAdmin.from('refunds').delete().in('appointment_id', appointmentIds);
            await supabaseAdmin.from('reviews').delete().in('appointment_id', appointmentIds);
        }
        await supabaseAdmin.from('appointments').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('reviews').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('coupons').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('financial_transactions').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('inventory_movements').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('inventory_items').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('suppliers').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('services').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('service_categories').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('business_hours').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('availability_exceptions').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('favorite_barberias').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('barberia_modules').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('loyalty_ledger').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('loyalty_accounts').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('payment_provider_accounts').delete().eq('barberia_id', barberiaId);
        await supabaseAdmin.from('audit_logs').delete().eq('barberia_id', barberiaId);

        if (membershipIds.length) {
            await supabaseAdmin.from('barber_portfolio_images').delete().in('membership_id', membershipIds);
            await supabaseAdmin.from('staff_availability').delete().in('membership_id', membershipIds);
            await supabaseAdmin.from('membership_module_permissions').delete().in('membership_id', membershipIds);
        }
        await supabaseAdmin.from('barberia_memberships').delete().eq('barberia_id', barberiaId);

        const { error: deleteBarberiaError } = await supabaseAdmin.from('barberias').delete().eq('id', barberiaId);
        if (deleteBarberiaError) throw deleteBarberiaError;

        for (const profileId of profileIds) {
            await supabaseAdmin.auth.admin.deleteUser(profileId);
        }

        res.json({ ok: true, nombre: barberia.name });
    } catch (error) {
        console.error('Error al eliminar la barbería:', error);
        res.status(500).json({ error: error.message || 'No fue posible eliminar la barbería.' });
    }
};

// Crea una barbería y, en el mismo paso, la cuenta de su dueño ya ligada como owner.
export const crearBarberiaConDuenio = async (req, res) => {
    const {
        nombreBarberia, telefono, descripcion, direccion, ciudad, estado, zona,
        nombreDuenio, emailDuenio, passwordDuenio,
    } = req.body;

    if (!nombreBarberia?.trim() || !direccion?.trim() || !ciudad || !estado || !zona) {
        return res.status(400).json({ error: 'Faltan datos de la barbería (nombre, dirección, ciudad, estado, zona).' });
    }
    if (!nombreDuenio?.trim() || !emailDuenio?.trim() || !passwordDuenio) {
        return res.status(400).json({ error: 'Faltan datos del dueño (nombre, correo, contraseña).' });
    }
    if (passwordDuenio.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    let nuevoUsuario;
    let barberiaCreada;

    try {
        // 1. Cuenta del dueño.
        const { data: usuario, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email: emailDuenio.trim(),
            password: passwordDuenio,
            email_confirm: true,
            user_metadata: { full_name: nombreDuenio.trim() },
        });
        if (createUserError) {
            if (createUserError.message?.includes('already registered')) {
                return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
            }
            throw createUserError;
        }
        nuevoUsuario = usuario.user;

        // 2. Barbería (reintenta el slug si choca con uno existente).
        const baseSlug = slugify(nombreBarberia) || 'barberia';
        let barberia = null;
        for (let intento = 0; intento < 5 && !barberia; intento += 1) {
            const slugCandidato = intento === 0 ? baseSlug : `${baseSlug}-${intento}`;
            const { data, error: barberiaError } = await supabaseAdmin
                .from('barberias')
                .insert({
                    slug: slugCandidato,
                    name: nombreBarberia.trim(),
                    description: descripcion?.trim() || null,
                    phone: telefono?.trim() || null,
                    address_line1: direccion.trim(),
                    city: ciudad,
                    state: estado,
                    zone: zona,
                })
                .select('id, name')
                .single();

            if (!barberiaError) {
                barberia = data;
            } else if (!(barberiaError.code === '23505' && barberiaError.message?.includes('slug'))) {
                throw barberiaError;
            }
        }
        if (!barberia) {
            throw new Error('No fue posible generar un identificador único para la barbería.');
        }
        barberiaCreada = barberia;

        // 3. Membresía de owner.
        const { error: membershipError } = await supabaseAdmin
            .from('barberia_memberships')
            .insert({ barberia_id: barberia.id, profile_id: nuevoUsuario.id, role: 'owner', display_name: nombreDuenio.trim() });
        if (membershipError) throw membershipError;

        // 4. Acceso a todos los módulos de la plataforma (igual que hace create_barberia).
        const { data: modulos } = await supabaseAdmin.from('platform_modules').select('id');
        if (modulos?.length) {
            const { error: modulesError } = await supabaseAdmin
                .from('barberia_modules')
                .insert(modulos.map((m) => ({ barberia_id: barberia.id, module_id: m.id, configured_by: req.user.id })));
            if (modulesError) throw modulesError;
        }

        res.status(201).json({
            barberia: { id: barberia.id, name: barberia.name },
            duenio: { id: nuevoUsuario.id, email: nuevoUsuario.email },
        });
    } catch (error) {
        console.error('Error al crear la barbería:', error);
        if (barberiaCreada) await supabaseAdmin.from('barberias').delete().eq('id', barberiaCreada.id);
        if (nuevoUsuario) await supabaseAdmin.auth.admin.deleteUser(nuevoUsuario.id);
        res.status(500).json({ error: error.message || 'No fue posible crear la barbería.' });
    }
};
