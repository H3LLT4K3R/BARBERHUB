import crypto from 'node:crypto';
import { Preference, Payment, PaymentRefund, PreApproval } from 'mercadopago';
import { mercadoPagoClient } from '../config/mercadopago.js';
import { supabaseAdmin } from '../config/supabase.js';
import { registrarIngresoPorPago } from './operacionController.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// Anticipo fijo para todas las citas (por ahora, sin importar el precio del servicio).
// El resto del total se liquida directamente en el local.
const ANTICIPO_FIJO_MXN = 75;

// Un cliente solo puede pagar una cita que sea suya; un miembro de la barbería no puede pagarla en su nombre.
async function getAppointmentForPayer(appointmentId, userId) {
    const { data: appointment, error } = await supabaseAdmin
        .from('appointments')
        .select('id, client_id, barberia_id, status, total, barberia:barberias(currency_code)')
        .eq('id', appointmentId)
        .maybeSingle();

    if (error) throw error;
    if (!appointment || appointment.client_id !== userId) return null;
    return appointment;
}

export const crearPreferencia = async (req, res) => {
    const { appointmentId } = req.body;
    if (!appointmentId) {
        return res.status(400).json({ error: 'Falta appointmentId.' });
    }

    try {
        const appointment = await getAppointmentForPayer(appointmentId, req.user.id);
        if (!appointment) {
            return res.status(404).json({ error: 'Cita no encontrada.' });
        }
        if (appointment.status !== 'pending_payment') {
            return res.status(409).json({ error: 'Esta cita no está esperando un pago.' });
        }

        // El anticipo es un monto fijo, no el total del servicio: el resto se paga en el local.
        const items = [{
            title: 'Anticipo de cita',
            quantity: 1,
            unit_price: ANTICIPO_FIJO_MXN,
            currency_id: appointment.barberia?.currency_code || 'MXN',
        }];

        // Mercado Pago exige que back_urls.success sea una URL pública (https) para usar
        // auto_return; en desarrollo local (http://localhost) lo omitimos y el cliente
        // vuelve a la app con un botón en vez de una redirección automática.
        const esUrlPublicaSegura = FRONTEND_URL.startsWith('https://');

        const preference = await new Preference(mercadoPagoClient).create({
            body: {
                items,
                external_reference: appointment.id,
                notification_url: `${BACKEND_URL}/api/pagos/mp/webhook`,
                back_urls: {
                    success: `${FRONTEND_URL}/cita-confirmada`,
                    failure: `${FRONTEND_URL}/datos-reserva`,
                    pending: `${FRONTEND_URL}/mis-citas`,
                },
                ...(esUrlPublicaSegura ? { auto_return: 'approved' } : {}),
            },
        });

        const { error: insertError } = await supabaseAdmin.from('payments').insert({
            appointment_id: appointment.id,
            payer_id: req.user.id,
            provider: 'mercado_pago',
            preference_id: preference.id,
            checkout_url: preference.init_point,
            amount: ANTICIPO_FIJO_MXN,
            currency_code: appointment.barberia?.currency_code || 'MXN',
            status: 'pending',
        });
        if (insertError) throw insertError;

        res.json({ checkoutUrl: preference.init_point, preferenceId: preference.id });
    } catch (error) {
        console.error('Error al crear preferencia de Mercado Pago:', error);
        res.status(500).json({ error: 'No fue posible iniciar el pago.' });
    }
};

// Valida la firma que manda Mercado Pago para confirmar que la notificación es legítima.
// Requiere MP_WEBHOOK_SECRET (Panel de Mercado Pago > Webhooks > Clave secreta).
function isValidSignature(req) {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) return true; // sin clave configurada, se omite (solo recomendado en desarrollo)

    const signatureHeader = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    const dataId = req.query['data.id'];
    if (!signatureHeader || !requestId || !dataId) return false;

    const parts = Object.fromEntries(
        signatureHeader.split(',').map((part) => part.trim().split('='))
    );
    const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
    const expectedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    return expectedHash === parts.v1;
}

export const recibirWebhook = async (req, res) => {
    // Mercado Pago espera un 200 rápido; los errores se registran pero no deben bloquear la respuesta.
    if (!isValidSignature(req)) {
        console.warn('Webhook de Mercado Pago con firma inválida, se ignora.');
        return res.sendStatus(200);
    }

    const { type, data, id: notificationId } = req.body || {};
    if ((type !== 'payment' && type !== 'subscription_preapproval') || !data?.id) {
        return res.sendStatus(200);
    }

    try {
        const { error: eventError } = await supabaseAdmin.from('payment_events').insert({
            provider: 'mercado_pago',
            provider_event_id: String(notificationId ?? data.id),
            event_type: type,
            payload: req.body,
        });
        if (eventError) {
            // Código 23505 = unique_violation: ya procesamos esta notificación antes.
            if (eventError.code === '23505') return res.sendStatus(200);
            throw eventError;
        }

        if (type === 'subscription_preapproval') {
            const preapproval = await new PreApproval(mercadoPagoClient).get({ id: data.id });
            const estadoMap = {
                authorized: 'activa',
                paused: 'pausada',
                cancelled: 'cancelada',
                pending: 'pendiente',
            };
            await supabaseAdmin
                .from('barberias')
                .update({
                    subscription_status: estadoMap[preapproval.status] || 'pendiente',
                    subscription_next_payment: preapproval.auto_recurring?.next_payment_date ?? null,
                })
                .eq('mp_preapproval_id', preapproval.id);

            return res.sendStatus(200);
        }

        const payment = await new Payment(mercadoPagoClient).get({ id: data.id });
        const appointmentId = payment.external_reference;

        const statusMap = {
            approved: 'approved',
            pending: 'pending',
            in_process: 'authorized',
            rejected: 'rejected',
            cancelled: 'cancelled',
            refunded: 'refunded',
            charged_back: 'charged_back',
        };
        const paymentStatus = statusMap[payment.status] || 'pending';

        const { data: paymentRow, error: updateError } = await supabaseAdmin
            .from('payments')
            .update({
                provider_payment_id: String(payment.id),
                status: paymentStatus,
                paid_at: payment.status === 'approved' ? new Date().toISOString() : null,
            })
            .eq('appointment_id', appointmentId)
            .is('provider_payment_id', null)
            .select('id, amount')
            .maybeSingle();
        if (updateError) throw updateError;

        if (payment.status === 'approved') {
            const { data: confirmedRows, error: confirmError } = await supabaseAdmin
                .from('appointments')
                .update({ status: 'pending_confirmation' })
                .eq('id', appointmentId)
                .eq('status', 'pending_payment')
                .select('id');

            // El pago ya se aprobó en Mercado Pago pero el horario chocó con otra cita confirmada
            // primero (dos personas pagando el mismo horario). Hay que reembolsar manualmente y
            // avisar al cliente: por ahora solo lo dejamos registrado para revisión.
            if (confirmError || !confirmedRows?.length) {
                console.error(
                    `⚠️ Pago ${payment.id} aprobado pero la cita ${appointmentId} no se pudo confirmar (posible choque de horario). Requiere revisión manual / reembolso.`,
                    confirmError?.message
                );
                await supabaseAdmin
                    .from('payments')
                    .update({ metadata: { conflict: true, reason: confirmError?.message || 'appointment_not_pending_payment' } })
                    .eq('appointment_id', appointmentId)
                    .eq('provider_payment_id', String(payment.id));
            } else {
                // El pago se recibió; falta que el barbero/admin dé la confirmación final.
                const { data: cita } = await supabaseAdmin
                    .from('appointments')
                    .select('barberia_id')
                    .eq('id', appointmentId)
                    .maybeSingle();
                if (cita) {
                    const { data: staff } = await supabaseAdmin
                        .from('barberia_memberships')
                        .select('profile_id')
                        .eq('barberia_id', cita.barberia_id)
                        .eq('is_active', true);
                    const filas = (staff ?? []).map((m) => ({
                        profile_id: m.profile_id,
                        type: 'payment',
                        title: 'Anticipo recibido',
                        body: 'Un cliente ya pagó su anticipo. Confírmale la cita al 100% para dejarla lista.',
                        action_url: '/barbero/citas',
                        data: { appointmentId },
                    }));
                    if (filas.length) {
                        const { error: notifError } = await supabaseAdmin.from('notifications').insert(filas);
                        if (notifError) console.error('No se pudieron crear notificaciones de pago:', notifError.message);
                    }

                    if (paymentRow) {
                        await registrarIngresoPorPago({
                            barberiaId: cita.barberia_id,
                            paymentId: paymentRow.id,
                            amount: paymentRow.amount,
                            appointmentId,
                        });
                    }
                }
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Error al procesar webhook de Mercado Pago:', error);
        res.sendStatus(200);
    }
};

export const estadoPago = async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const { data: appointment, error: appointmentError } = await supabaseAdmin
            .from('appointments')
            .select('id, client_id, barberia_id')
            .eq('id', appointmentId)
            .maybeSingle();
        if (appointmentError) throw appointmentError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

        const isOwnerOfAppointment = appointment.client_id === req.user.id;
        let isStaff = false;
        if (!isOwnerOfAppointment) {
            const { data: membership } = await supabaseAdmin
                .from('barberia_memberships')
                .select('id')
                .eq('barberia_id', appointment.barberia_id)
                .eq('profile_id', req.user.id)
                .eq('is_active', true)
                .maybeSingle();
            isStaff = Boolean(membership);
        }
        if (!isOwnerOfAppointment && !isStaff) {
            return res.status(403).json({ error: 'No tienes acceso a esta cita.' });
        }

        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .select('status, amount, currency_code, paid_at, checkout_url')
            .eq('appointment_id', appointmentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (paymentError) throw paymentError;

        res.json({ payment: payment || null });
    } catch (error) {
        console.error('Error al consultar estado de pago:', error);
        res.status(500).json({ error: 'No fue posible consultar el pago.' });
    }
};

// Reembolsa un pago aprobado en Mercado Pago y lo deja registrado en `refunds` y `payments`.
// Se usa desde citasController.js cuando un cliente cancela una cita ya pagada.
// Lanza si el reembolso falla: quien llama decide qué hacer (no cancelar la cita si esto falla).
export async function reembolsarPago({ paymentId, providerPaymentId, amount, reason, requestedBy }) {
    const refund = await new PaymentRefund(mercadoPagoClient).create({ payment_id: providerPaymentId });

    const { error: refundInsertError } = await supabaseAdmin.from('refunds').insert({
        payment_id: paymentId,
        amount,
        reason,
        provider_refund_id: String(refund.id),
        status: 'approved',
        requested_by: requestedBy,
    });
    if (refundInsertError) throw refundInsertError;

    const { error: paymentUpdateError } = await supabaseAdmin
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', paymentId);
    if (paymentUpdateError) throw paymentUpdateError;

    return refund;
}
