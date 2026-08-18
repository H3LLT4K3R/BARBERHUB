import { supabaseAdmin } from '../config/supabase.js';

// Las notificaciones son informativas: un fallo aquí no debe romper el flujo principal.
async function notificar(filas) {
    if (!filas.length) return;
    const { error } = await supabaseAdmin.from('notifications').insert(filas);
    if (error) console.error('No se pudieron crear notificaciones:', error.message);
}

async function obtenerSuperAdminIds() {
    const { data, error } = await supabaseAdmin.from('profiles').select('id').eq('is_super_admin', true);
    if (error) {
        console.error('No se pudo obtener la lista de super admins:', error.message);
        return [];
    }
    return (data ?? []).map((p) => p.id);
}

// El super admin consulta/edita el link de pago de Mercado Pago de la plataforma (uno solo,
// usado para cobrar la suscripción mensual a todas las barberías).
export const obtenerConfigPlataforma = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('platform_settings')
            .select('subscription_payment_link_url')
            .eq('id', true)
            .maybeSingle();
        if (error) throw error;
        res.json({ subscriptionPaymentLinkUrl: data?.subscription_payment_link_url ?? null });
    } catch (error) {
        console.error('Error al obtener la configuración de la plataforma:', error);
        res.status(500).json({ error: 'No fue posible obtener la configuración.' });
    }
};

export const actualizarConfigPlataforma = async (req, res) => {
    const { subscriptionPaymentLinkUrl } = req.body;
    try {
        const { error } = await supabaseAdmin
            .from('platform_settings')
            .update({ subscription_payment_link_url: (subscriptionPaymentLinkUrl || '').trim() || null })
            .eq('id', true);
        if (error) throw error;
        res.json({ ok: true });
    } catch (error) {
        console.error('Error al actualizar la configuración de la plataforma:', error);
        res.status(500).json({ error: 'No fue posible guardar el link.' });
    }
};

// El owner ya pagó con el link manual de la plataforma y sube su comprobante (la imagen ya
// se subió a Storage desde el frontend; aquí solo se registra la ruta y se avisa al super admin).
export const subirComprobanteSuscripcion = async (req, res) => {
    const { barberiaId } = req.params;
    const { proofPath } = req.body;
    if (!proofPath) {
        return res.status(400).json({ error: 'Falta proofPath.' });
    }
    // El path debe vivir dentro de la carpeta de ESTA barbería (suscripciones/{id}/...), igual
    // que el comprobante de citas está acotado a su propia carpeta — ver subirComprobante en
    // citasController.js.
    if (!proofPath.startsWith(`suscripciones/${barberiaId}/`)) {
        return res.status(400).json({ error: 'El comprobante no corresponde a esta barbería.' });
    }

    try {
        const { data: membership } = await supabaseAdmin
            .from('barberia_memberships')
            .select('barberia_id')
            .eq('barberia_id', barberiaId)
            .eq('profile_id', req.user.id)
            .eq('role', 'owner')
            .eq('is_active', true)
            .maybeSingle();
        if (!membership) return res.status(403).json({ error: 'No eres el dueño de esta barbería.' });

        const { error: updateError } = await supabaseAdmin
            .from('barberias')
            .update({ subscription_proof_image_path: proofPath, subscription_status: 'pendiente_revision' })
            .eq('id', barberiaId);
        if (updateError) throw updateError;

        const superAdminIds = await obtenerSuperAdminIds();
        await notificar(
            superAdminIds.map((profileId) => ({
                profile_id: profileId,
                type: 'payment',
                title: 'Comprobante de suscripción recibido',
                body: 'Una barbería subió su comprobante de pago mensual. Revísalo para activar su suscripción.',
                action_url: '/super-admin',
                data: { barberiaId },
            }))
        );

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al registrar el comprobante de suscripción:', error);
        res.status(500).json({ error: 'No fue posible registrar el comprobante.' });
    }
};

// El owner consulta el estado de la suscripción de su propia barbería (y el link de pago
// vigente de la plataforma, para mostrarlo si todavía no tiene suscripción activa).
export const obtenerEstadoSuscripcion = async (req, res) => {
    try {
        const { data: membership } = await supabaseAdmin
            .from('barberia_memberships')
            .select('barberia_id')
            .eq('profile_id', req.user.id)
            .eq('role', 'owner')
            .eq('is_active', true)
            .maybeSingle();
        if (!membership) return res.status(404).json({ error: 'No perteneces a ninguna barbería como dueño.' });

        const [{ data: barberia, error }, { data: config }] = await Promise.all([
            supabaseAdmin
                .from('barberias')
                .select('subscription_status, subscription_amount, subscription_next_payment, is_suspended')
                .eq('id', membership.barberia_id)
                .single(),
            supabaseAdmin.from('platform_settings').select('subscription_payment_link_url').eq('id', true).maybeSingle(),
        ]);
        if (error) throw error;

        res.json({
            ...barberia,
            barberiaId: membership.barberia_id,
            platformPaymentLink: config?.subscription_payment_link_url ?? null,
        });
    } catch (error) {
        console.error('Error al obtener el estado de la suscripción:', error);
        res.status(500).json({ error: 'No fue posible obtener el estado de la suscripción.' });
    }
};

// El super admin revisó el comprobante y confirma que el pago sí llegó: activa la suscripción.
export const confirmarComprobanteSuscripcion = async (req, res) => {
    const { barberiaId } = req.params;
    try {
        const { data: barberia, error: fetchError } = await supabaseAdmin
            .from('barberias')
            .select('id, subscription_status, subscription_amount')
            .eq('id', barberiaId)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!barberia) return res.status(404).json({ error: 'Barbería no encontrada.' });
        if (barberia.subscription_status !== 'pendiente_revision') {
            return res.status(409).json({ error: 'No hay ningún comprobante pendiente de revisión.' });
        }

        const proximoPago = new Date();
        proximoPago.setMonth(proximoPago.getMonth() + 1);

        const { error: updateError } = await supabaseAdmin
            .from('barberias')
            .update({ subscription_status: 'activa', subscription_next_payment: proximoPago.toISOString() })
            .eq('id', barberiaId);
        if (updateError) throw updateError;

        const { data: duenio } = await supabaseAdmin
            .from('barberia_memberships')
            .select('profile_id')
            .eq('barberia_id', barberiaId)
            .eq('role', 'owner')
            .eq('is_active', true)
            .maybeSingle();
        if (duenio) {
            await notificar([{
                profile_id: duenio.profile_id,
                type: 'payment',
                title: 'Suscripción activada',
                body: 'Confirmamos tu pago mensual. Tu suscripción ya está activa.',
                action_url: '/owner/control',
                data: { barberiaId },
            }]);
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al confirmar el comprobante de suscripción:', error);
        res.status(500).json({ error: 'No fue posible confirmar el pago.' });
    }
};

// El super admin rechaza el comprobante (no se ve claro, monto incorrecto, etc.); el owner
// puede subir uno nuevo.
export const rechazarComprobanteSuscripcion = async (req, res) => {
    const { barberiaId } = req.params;
    const { motivo } = req.body;
    try {
        const { data: barberia, error: fetchError } = await supabaseAdmin
            .from('barberias')
            .select('id, subscription_status')
            .eq('id', barberiaId)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!barberia) return res.status(404).json({ error: 'Barbería no encontrada.' });
        if (barberia.subscription_status !== 'pendiente_revision') {
            return res.status(409).json({ error: 'No hay ningún comprobante pendiente de revisión.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('barberias')
            .update({ subscription_status: 'sin_suscripcion', subscription_proof_image_path: null })
            .eq('id', barberiaId);
        if (updateError) throw updateError;

        const { data: duenio } = await supabaseAdmin
            .from('barberia_memberships')
            .select('profile_id')
            .eq('barberia_id', barberiaId)
            .eq('role', 'owner')
            .eq('is_active', true)
            .maybeSingle();
        if (duenio) {
            await notificar([{
                profile_id: duenio.profile_id,
                type: 'payment',
                title: 'Tu comprobante de suscripción no pudo verificarse',
                body: motivo || 'Revisa que la imagen sea clara y el monto correcto, y súbelo de nuevo.',
                action_url: '/owner/control',
                data: { barberiaId },
            }]);
        }

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al rechazar el comprobante de suscripción:', error);
        res.status(500).json({ error: 'No fue posible rechazar el comprobante.' });
    }
};

// El super admin da de baja o reactiva manualmente una barbería (por ejemplo, por falta de pago).
export const cambiarSuspension = async (req, res) => {
    const { barberiaId } = req.params;
    const { suspendida } = req.body;

    try {
        const { error } = await supabaseAdmin
            .from('barberias')
            .update({ is_suspended: !!suspendida })
            .eq('id', barberiaId);
        if (error) throw error;

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al cambiar la suspensión:', error);
        res.status(500).json({ error: 'No fue posible actualizar la barbería.' });
    }
};
