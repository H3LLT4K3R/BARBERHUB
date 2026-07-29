import { PreApproval } from 'mercadopago';
import { mercadoPagoClient } from '../config/mercadopago.js';
import { supabaseAdmin } from '../config/supabase.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// El super admin captura el monto mensual (todavía no hay un precio único definido para todas
// las barberías) y genera el link de Mercado Pago para que el dueño autorice el cobro recurrente.
export const crearSuscripcion = async (req, res) => {
    const { barberiaId, monto } = req.body;

    if (!barberiaId || !monto || Number(monto) <= 0) {
        return res.status(400).json({ error: 'Faltan barberiaId o un monto mensual válido.' });
    }

    try {
        const { data: barberia, error: barberiaError } = await supabaseAdmin
            .from('barberias')
            .select('id, name')
            .eq('id', barberiaId)
            .maybeSingle();
        if (barberiaError) throw barberiaError;
        if (!barberia) return res.status(404).json({ error: 'Barbería no encontrada.' });

        const { data: membership } = await supabaseAdmin
            .from('barberia_memberships')
            .select('profile_id')
            .eq('barberia_id', barberiaId)
            .eq('role', 'owner')
            .eq('is_active', true)
            .maybeSingle();
        if (!membership) return res.status(409).json({ error: 'Esta barbería todavía no tiene un dueño asignado.' });

        const { data: usuario } = await supabaseAdmin.auth.admin.getUserById(membership.profile_id);
        const emailDuenio = usuario?.user?.email;
        if (!emailDuenio) return res.status(500).json({ error: 'No fue posible obtener el correo del dueño.' });

        // El back_url de una suscripción (a diferencia del checkout de un solo pago) exige una
        // URL https real; en desarrollo local usamos un placeholder para no romper la creación.
        const backUrl = FRONTEND_URL.startsWith('https://') ? `${FRONTEND_URL}/owner-control` : 'https://www.mercadopago.com.mx';

        const preapproval = await new PreApproval(mercadoPagoClient).create({
            body: {
                reason: `Suscripción mensual Barber Hub - ${barberia.name}`,
                external_reference: barberia.id,
                payer_email: emailDuenio,
                back_url: backUrl,
                notification_url: `${BACKEND_URL}/api/pagos/mp/webhook`,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: Number(monto),
                    currency_id: 'MXN',
                },
                status: 'pending',
            },
        });

        const { error: updateError } = await supabaseAdmin
            .from('barberias')
            .update({
                mp_preapproval_id: preapproval.id,
                subscription_amount: Number(monto),
                subscription_status: 'pendiente',
            })
            .eq('id', barberiaId);
        if (updateError) throw updateError;

        res.json({ initPoint: preapproval.init_point, preapprovalId: preapproval.id });
    } catch (error) {
        console.error('Error al crear la suscripción:', error);
        res.status(500).json({ error: error.message || 'No fue posible crear la suscripción.' });
    }
};

// El owner consulta el estado de la suscripción de su propia barbería.
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

        const { data: barberia, error } = await supabaseAdmin
            .from('barberias')
            .select('subscription_status, subscription_amount, subscription_next_payment, mp_preapproval_id, is_suspended')
            .eq('id', membership.barberia_id)
            .single();
        if (error) throw error;

        let initPoint = null;
        if (barberia.subscription_status === 'pendiente' && barberia.mp_preapproval_id) {
            const preapproval = await new PreApproval(mercadoPagoClient).get({ id: barberia.mp_preapproval_id });
            initPoint = preapproval.init_point;
        }

        res.json({ ...barberia, initPoint });
    } catch (error) {
        console.error('Error al obtener el estado de la suscripción:', error);
        res.status(500).json({ error: 'No fue posible obtener el estado de la suscripción.' });
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
