import { supabaseAdmin } from '../config/supabase.js';
import { reembolsarPago } from './mercadoPagoController.js';
import { registrarAuditoria } from '../utils/auditoria.js';

const SLOT_MINUTES = 30;
const BLOCKING_STATUSES = ['pending_confirmation', 'confirmed', 'in_progress'];

const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};
const minutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

// Devuelve los profile_id de los miembros activos de una barbería (para avisarles
// de nuevas solicitudes). Best-effort: si falla, no debe tumbar la operación principal.
async function obtenerStaffActivo(barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('profile_id')
        .eq('barberia_id', barberiaId)
        .eq('is_active', true);
    if (error) {
        console.error('No se pudo obtener el staff de la barbería:', error.message);
        return [];
    }
    return (data ?? []).map((m) => m.profile_id);
}

// Las notificaciones son informativas: un fallo aquí no debe romper el flujo de la cita.
async function notificar(filas) {
    if (!filas.length) return;
    const { error } = await supabaseAdmin.from('notifications').insert(filas);
    if (error) console.error('No se pudieron crear notificaciones:', error.message);
}

// Confirma que el usuario autenticado es owner/admin/barbero activo de la barbería.
async function esStaffDeLaBarberia(userId, barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('id, role')
        .eq('barberia_id', barberiaId)
        .eq('profile_id', userId)
        .eq('is_active', true)
        .maybeSingle();
    if (error) throw error;
    return data;
}

// -------------------- DISPONIBILIDAD --------------------
export const obtenerDisponibilidad = async (req, res) => {
    const { barberiaId, barberMembershipId, fecha, duracionMinutos } = req.query;
    if (!barberiaId || !fecha) {
        return res.status(400).json({ error: 'Faltan barberiaId o fecha.' });
    }

    const duracion = Number(duracionMinutos) > 0 ? Number(duracionMinutos) : SLOT_MINUTES;
    const weekday = new Date(`${fecha}T00:00:00Z`).getUTCDay(); // 0=domingo ... 6=sábado, igual que la tabla

    try {
        const { data: barberia, error: barberiaError } = await supabaseAdmin
            .from('barberias')
            .select('id, is_published')
            .eq('id', barberiaId)
            .maybeSingle();
        if (barberiaError) throw barberiaError;
        if (!barberia || !barberia.is_published) {
            return res.status(404).json({ error: 'Barbería no encontrada.' });
        }

        const { data: businessHours, error: hoursError } = await supabaseAdmin
            .from('business_hours')
            .select('opens_at, closes_at, is_closed')
            .eq('barberia_id', barberiaId)
            .eq('weekday', weekday)
            .maybeSingle();
        if (hoursError) throw hoursError;

        let windowStart = businessHours && !businessHours.is_closed ? timeToMinutes(businessHours.opens_at) : null;
        let windowEnd = businessHours && !businessHours.is_closed ? timeToMinutes(businessHours.closes_at) : null;

        if (barberMembershipId) {
            const { data: staffAvailability, error: staffError } = await supabaseAdmin
                .from('staff_availability')
                .select('starts_at, ends_at')
                .eq('membership_id', barberMembershipId)
                .eq('weekday', weekday)
                .maybeSingle();
            if (staffError) throw staffError;

            if (!staffAvailability) {
                windowStart = null; // el barbero no trabaja ese día
            } else {
                windowStart = Math.max(windowStart ?? 0, timeToMinutes(staffAvailability.starts_at));
                windowEnd = Math.min(windowEnd ?? 24 * 60, timeToMinutes(staffAvailability.ends_at));
            }
        }

        const { data: exceptions, error: exceptionsError } = await supabaseAdmin
            .from('availability_exceptions')
            .select('membership_id, starts_at, ends_at, is_closed')
            .eq('barberia_id', barberiaId)
            .eq('exception_date', fecha)
            .or(barberMembershipId ? `membership_id.is.null,membership_id.eq.${barberMembershipId}` : 'membership_id.is.null');
        if (exceptionsError) throw exceptionsError;

        for (const exception of exceptions ?? []) {
            if (exception.is_closed) {
                windowStart = null;
            } else if (windowStart !== null) {
                windowStart = Math.max(windowStart, timeToMinutes(exception.starts_at));
                windowEnd = Math.min(windowEnd, timeToMinutes(exception.ends_at));
            }
        }

        if (windowStart === null || windowEnd === null || windowStart >= windowEnd) {
            return res.json({ fecha, slots: [] });
        }

        let appointmentsQuery = supabaseAdmin
            .from('appointments')
            .select('scheduled_at, duration_minutes')
            .eq('barberia_id', barberiaId)
            .in('status', BLOCKING_STATUSES)
            .gte('scheduled_at', `${fecha}T00:00:00`)
            .lt('scheduled_at', `${fecha}T23:59:59`);
        if (barberMembershipId) {
            appointmentsQuery = appointmentsQuery.eq('barber_membership_id', barberMembershipId);
        }
        const { data: busy, error: busyError } = await appointmentsQuery;
        if (busyError) throw busyError;

        const busyRanges = (busy ?? []).map((appointment) => {
            const start = new Date(appointment.scheduled_at);
            const startMinutes = start.getUTCHours() * 60 + start.getUTCMinutes();
            return { start: startMinutes, end: startMinutes + appointment.duration_minutes };
        });

        const slots = [];
        for (let start = windowStart; start + duracion <= windowEnd; start += SLOT_MINUTES) {
            const end = start + duracion;
            const overlaps = busyRanges.some((range) => start < range.end && end > range.start);
            slots.push({ hora: minutesToTime(start), disponible: !overlaps });
        }

        res.json({ fecha, slots });
    } catch (error) {
        console.error('Error al calcular disponibilidad:', error);
        res.status(500).json({ error: 'No fue posible consultar la disponibilidad.' });
    }
};

// -------------------- CREAR CITA --------------------
export const crearCita = async (req, res) => {
    const { barberiaId, barberMembershipId, scheduledAt, serviceIds, clientNote, couponCode } = req.body;

    if (!barberiaId || !scheduledAt || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({ error: 'Faltan barberiaId, scheduledAt o serviceIds.' });
    }

    try {
        const { data: barberia, error: barberiaError } = await supabaseAdmin
            .from('barberias')
            .select('id, is_published, currency_code')
            .eq('id', barberiaId)
            .maybeSingle();
        if (barberiaError) throw barberiaError;
        if (!barberia || !barberia.is_published) {
            return res.status(404).json({ error: 'Barbería no encontrada.' });
        }

        if (barberMembershipId) {
            const { data: membership, error: membershipError } = await supabaseAdmin
                .from('barberia_memberships')
                .select('id, role, is_active, barber_settings(accepting_appointments)')
                .eq('id', barberMembershipId)
                .eq('barberia_id', barberiaId)
                .maybeSingle();
            if (membershipError) throw membershipError;
            if (!membership || membership.role !== 'barber' || !membership.is_active) {
                return res.status(400).json({ error: 'El barbero seleccionado no es válido.' });
            }
            if (membership.barber_settings && !membership.barber_settings.accepting_appointments) {
                return res.status(409).json({ error: 'Este barbero no está aceptando citas por ahora.' });
            }
        }

        const uniqueServiceIds = [...new Set(serviceIds)];
        const { data: services, error: servicesError } = await supabaseAdmin
            .from('services')
            .select('id, name, price, duration_minutes')
            .eq('barberia_id', barberiaId)
            .eq('is_active', true)
            .in('id', uniqueServiceIds);
        if (servicesError) throw servicesError;
        if (!services || services.length !== uniqueServiceIds.length) {
            return res.status(400).json({ error: 'Uno o más servicios no existen o no están disponibles en esta barbería.' });
        }

        let staffOverrides = new Map();
        if (barberMembershipId) {
            const { data: overrides, error: overridesError } = await supabaseAdmin
                .from('staff_services')
                .select('service_id, custom_price, custom_duration_minutes')
                .eq('membership_id', barberMembershipId)
                .eq('is_active', true)
                .in('service_id', uniqueServiceIds);
            if (overridesError) throw overridesError;
            staffOverrides = new Map((overrides ?? []).map((o) => [o.service_id, o]));
        }

        const quantities = serviceIds.reduce((map, id) => map.set(id, (map.get(id) ?? 0) + 1), new Map());
        const lineItems = services.map((service) => {
            const override = staffOverrides.get(service.id);
            const unitPrice = Number(override?.custom_price ?? service.price);
            const durationMinutes = override?.custom_duration_minutes ?? service.duration_minutes;
            return {
                service_id: service.id,
                service_name: service.name,
                unit_price: unitPrice,
                duration_minutes: durationMinutes,
                quantity: quantities.get(service.id),
            };
        });

        const subtotal = round2(lineItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0));
        const totalDuration = lineItems.reduce((sum, item) => sum + item.duration_minutes * item.quantity, 0);

        let discountTotal = 0;
        let coupon = null;
        if (couponCode) {
            const nowIso = new Date().toISOString();
            const { data: foundCoupon, error: couponError } = await supabaseAdmin
                .from('coupons')
                .select('*')
                .eq('barberia_id', barberiaId)
                .eq('code', couponCode)
                .eq('is_active', true)
                .lte('starts_at', nowIso)
                .gte('ends_at', nowIso)
                .maybeSingle();
            if (couponError) throw couponError;
            if (!foundCoupon) {
                return res.status(400).json({ error: 'Cupón inválido o expirado.' });
            }
            if (subtotal < Number(foundCoupon.minimum_subtotal)) {
                return res.status(400).json({ error: `Este cupón requiere un mínimo de $${foundCoupon.minimum_subtotal}.` });
            }
            if (foundCoupon.usage_limit) {
                const { count, error: usageError } = await supabaseAdmin
                    .from('coupon_redemptions')
                    .select('id', { count: 'exact', head: true })
                    .eq('coupon_id', foundCoupon.id);
                if (usageError) throw usageError;
                if (count >= foundCoupon.usage_limit) {
                    return res.status(400).json({ error: 'Este cupón ya alcanzó su límite de usos.' });
                }
            }
            const { count: clientUsage, error: clientUsageError } = await supabaseAdmin
                .from('coupon_redemptions')
                .select('id', { count: 'exact', head: true })
                .eq('coupon_id', foundCoupon.id)
                .eq('client_id', req.user.id);
            if (clientUsageError) throw clientUsageError;
            if (clientUsage >= foundCoupon.per_client_limit) {
                return res.status(400).json({ error: 'Ya usaste este cupón el máximo de veces permitido.' });
            }

            const rawDiscount = foundCoupon.discount_type === 'percent'
                ? subtotal * (Number(foundCoupon.discount_value) / 100)
                : Number(foundCoupon.discount_value);
            const cappedDiscount = foundCoupon.maximum_discount
                ? Math.min(rawDiscount, Number(foundCoupon.maximum_discount))
                : rawDiscount;
            discountTotal = round2(Math.min(cappedDiscount, subtotal));
            coupon = foundCoupon;
        }

        const total = round2(subtotal - discountTotal);

        const { data: appointment, error: appointmentError } = await supabaseAdmin
            .from('appointments')
            .insert({
                barberia_id: barberiaId,
                client_id: req.user.id,
                barber_membership_id: barberMembershipId || null,
                scheduled_at: scheduledAt,
                duration_minutes: totalDuration,
                client_note: clientNote || null,
                subtotal,
                discount_total: discountTotal,
                total,
                // No se pide pago todavía: primero el barbero/admin debe aceptar la
                // solicitud. Este mismo estado también bloquea el horario para otros
                // clientes (ver appointments_no_barber_overlap en el esquema SQL).
                status: 'pending_confirmation',
            })
            .select('id, confirmation_code, scheduled_at, subtotal, discount_total, total, status')
            .single();

        if (appointmentError) {
            if (appointmentError.code === '23P01') {
                return res.status(409).json({ error: 'Ese horario ya no está disponible. Elige otro.' });
            }
            throw appointmentError;
        }

        const { error: servicesInsertError } = await supabaseAdmin.from('appointment_services').insert(
            lineItems.map((item) => ({
                appointment_id: appointment.id,
                service_id: item.service_id,
                service_name: item.service_name,
                duration_minutes: item.duration_minutes,
                unit_price: item.unit_price,
                quantity: item.quantity,
            }))
        );
        if (servicesInsertError) {
            await supabaseAdmin.from('appointments').delete().eq('id', appointment.id);
            throw servicesInsertError;
        }

        if (coupon) {
            const { error: redemptionError } = await supabaseAdmin.from('coupon_redemptions').insert({
                coupon_id: coupon.id,
                appointment_id: appointment.id,
                client_id: req.user.id,
                discount_amount: discountTotal,
            });
            if (redemptionError) {
                await supabaseAdmin.from('appointment_services').delete().eq('appointment_id', appointment.id);
                await supabaseAdmin.from('appointments').delete().eq('id', appointment.id);
                throw redemptionError;
            }
        }

        const staffIds = await obtenerStaffActivo(barberiaId);
        await notificar(
            staffIds.map((profileId) => ({
                profile_id: profileId,
                type: 'appointment',
                title: 'Nueva solicitud de cita',
                body: `Tienes una nueva solicitud para el ${new Date(scheduledAt).toLocaleString('es-MX')}. Revísala para aceptarla o rechazarla.`,
                action_url: `/barbero/citas`,
                data: { appointmentId: appointment.id },
            }))
        );

        res.status(201).json({
            appointment: { ...appointment, currency_code: barberia.currency_code },
            services: lineItems,
        });
    } catch (error) {
        console.error('Error al crear la cita:', error);
        res.status(500).json({ error: 'No fue posible crear la cita.' });
    }
};

// -------------------- CANCELACIÓN DEL CLIENTE --------------------

// El cliente cancela su propia cita. Si ya había un pago aprobado, primero se
// reembolsa en Mercado Pago; si el reembolso falla, la cita NO se cancela (para
// no liberar el horario mientras el cliente se queda sin su dinero de vuelta).
export const cancelarCita = async (req, res) => {
    const { motivo } = req.body;

    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, barberia_id, client_id, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });
        if (appointment.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Esta cita no te pertenece.' });
        }
        if (!['pending_payment', 'pending_confirmation', 'confirmed'].includes(appointment.status)) {
            return res.status(409).json({ error: 'Esta cita ya no se puede cancelar.' });
        }

        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .select('id, provider_payment_id, amount')
            .eq('appointment_id', appointment.id)
            .eq('status', 'approved')
            .maybeSingle();
        if (paymentError) throw paymentError;

        if (payment) {
            try {
                await reembolsarPago({
                    paymentId: payment.id,
                    providerPaymentId: payment.provider_payment_id,
                    amount: payment.amount,
                    reason: motivo || 'Cancelada por el cliente',
                    requestedBy: req.user.id,
                });
            } catch (refundError) {
                console.error('Error al reembolsar el pago al cancelar:', refundError.message);
                return res.status(502).json({ error: 'No fue posible procesar el reembolso. Intenta de nuevo o contacta a soporte.' });
            }
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancelled_by: req.user.id,
                cancellation_reason: motivo || 'Cancelada por el cliente',
            })
            .eq('id', appointment.id);
        if (updateError) throw updateError;

        const staffIds = await obtenerStaffActivo(appointment.barberia_id);
        await notificar(
            staffIds.map((profileId) => ({
                profile_id: profileId,
                type: 'appointment',
                title: 'Cita cancelada por el cliente',
                body: payment
                    ? 'El cliente canceló su cita. Ya se procesó el reembolso de su anticipo.'
                    : 'El cliente canceló su cita.',
                action_url: '/barbero/citas',
                data: { appointmentId: appointment.id },
            }))
        );

        await registrarAuditoria({
            barberiaId: appointment.barberia_id,
            actorId: req.user.id,
            action: 'appointment.cancel',
            entityType: 'appointment',
            entityId: appointment.id,
            oldData: { status: appointment.status },
            newData: { status: 'cancelled', motivo, reembolsado: Boolean(payment) },
        });

        res.json({ ok: true, reembolsado: Boolean(payment) });
    } catch (error) {
        console.error('Error al cancelar la cita:', error);
        res.status(500).json({ error: 'No fue posible cancelar la cita.' });
    }
};

// -------------------- REVISIÓN DEL BARBERO/ADMIN --------------------

// Paso 1: el barbero/admin aprueba la solicitud (todavía sin pago) y el cliente
// queda habilitado para pagar el anticipo.
export const aceptarCita = async (req, res) => {
    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, barberia_id, client_id, status, scheduled_at')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

        const staffMembership = await esStaffDeLaBarberia(req.user.id, appointment.barberia_id);
        if (!staffMembership) return res.status(403).json({ error: 'No perteneces a esta barbería.' });
        if (appointment.status !== 'pending_confirmation') {
            return res.status(409).json({ error: 'Esta solicitud ya no está pendiente de revisión.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'pending_payment' })
            .eq('id', appointment.id)
            .eq('status', 'pending_confirmation');
        if (updateError) throw updateError;

        await notificar([{
            profile_id: appointment.client_id,
            type: 'appointment',
            title: '¡Tu cita fue aceptada!',
            body: 'El barbero aprobó tu solicitud. Realiza el pago del anticipo para asegurar tu horario.',
            action_url: '/mis-citas',
            data: { appointmentId: appointment.id },
        }]);

        await registrarAuditoria({
            barberiaId: appointment.barberia_id,
            actorId: req.user.id,
            action: 'appointment.accept',
            entityType: 'appointment',
            entityId: appointment.id,
            oldData: { status: 'pending_confirmation' },
            newData: { status: 'pending_payment' },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al aceptar la cita:', error);
        res.status(500).json({ error: 'No fue posible aceptar la cita.' });
    }
};

// El barbero/admin rechaza la solicitud (antes del pago) o cancela una ya pagada
// que aún no ha confirmado al 100% (en ese caso el reembolso se gestiona aparte, manualmente).
export const rechazarCita = async (req, res) => {
    const { motivo } = req.body;

    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, barberia_id, client_id, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

        const staffMembership = await esStaffDeLaBarberia(req.user.id, appointment.barberia_id);
        if (!staffMembership) return res.status(403).json({ error: 'No perteneces a esta barbería.' });
        if (!['pending_confirmation', 'pending_payment'].includes(appointment.status)) {
            return res.status(409).json({ error: 'Esta cita ya no se puede rechazar.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({
                status: 'rejected',
                cancelled_at: new Date().toISOString(),
                cancelled_by: req.user.id,
                cancellation_reason: motivo || 'Rechazada por la barbería.',
            })
            .eq('id', appointment.id);
        if (updateError) throw updateError;

        await notificar([{
            profile_id: appointment.client_id,
            type: 'appointment',
            title: 'Tu solicitud de cita fue rechazada',
            body: motivo || 'La barbería no pudo confirmar tu cita en ese horario. Intenta con otro horario.',
            action_url: '/explorar',
            data: { appointmentId: appointment.id },
        }]);

        await registrarAuditoria({
            barberiaId: appointment.barberia_id,
            actorId: req.user.id,
            action: 'appointment.reject',
            entityType: 'appointment',
            entityId: appointment.id,
            oldData: { status: appointment.status },
            newData: { status: 'rejected', motivo },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al rechazar la cita:', error);
        res.status(500).json({ error: 'No fue posible rechazar la cita.' });
    }
};

// Paso final: ya se pagó el anticipo y el barbero/admin confirma al 100%.
export const confirmarCitaFinal = async (req, res) => {
    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, barberia_id, client_id, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

        const staffMembership = await esStaffDeLaBarberia(req.user.id, appointment.barberia_id);
        if (!staffMembership) return res.status(403).json({ error: 'No perteneces a esta barbería.' });
        if (appointment.status !== 'pending_confirmation') {
            return res.status(409).json({ error: 'Esta cita no está lista para la confirmación final (falta el pago).' });
        }

        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .select('id, status')
            .eq('appointment_id', appointment.id)
            .eq('status', 'approved')
            .maybeSingle();
        if (paymentError) throw paymentError;
        if (!payment) {
            return res.status(409).json({ error: 'Todavía no se registra el pago del anticipo para esta cita.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', appointment.id)
            .eq('status', 'pending_confirmation');
        if (updateError) throw updateError;

        await notificar([{
            profile_id: appointment.client_id,
            type: 'appointment',
            title: '¡Tu cita quedó confirmada al 100%!',
            body: 'La barbería confirmó tu cita. Te esperamos en tu horario reservado.',
            action_url: '/mis-citas',
            data: { appointmentId: appointment.id },
        }]);

        await registrarAuditoria({
            barberiaId: appointment.barberia_id,
            actorId: req.user.id,
            action: 'appointment.confirm_final',
            entityType: 'appointment',
            entityId: appointment.id,
            oldData: { status: 'pending_confirmation' },
            newData: { status: 'confirmed' },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al confirmar la cita:', error);
        res.status(500).json({ error: 'No fue posible confirmar la cita.' });
    }
};

// -------------------- DÍA DE LA CITA --------------------

// El barbero marca que el cliente llegó y el servicio comenzó.
export const iniciarServicio = async (req, res) => {
    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, barberia_id, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

        const staffMembership = await esStaffDeLaBarberia(req.user.id, appointment.barberia_id);
        if (!staffMembership) return res.status(403).json({ error: 'No perteneces a esta barbería.' });
        if (appointment.status !== 'confirmed') {
            return res.status(409).json({ error: 'Solo se puede iniciar una cita ya confirmada.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'in_progress' })
            .eq('id', appointment.id)
            .eq('status', 'confirmed');
        if (updateError) throw updateError;

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al iniciar el servicio:', error);
        res.status(500).json({ error: 'No fue posible iniciar el servicio.' });
    }
};

// Puntos de fidelidad al completar una cita: 1 punto por cada unidad de moneda pagada.
// Regla simple y ajustable; vive aquí porque loyalty_ledger no tiene políticas RLS
// para nadie (ver DB/supabase-schema-production.sql) — solo el backend puede tocarla.
async function otorgarPuntosFidelidad(barberiaId, profileId, appointmentId, monto) {
    const puntos = Math.floor(Number(monto));
    if (puntos <= 0) return;

    const { error: upsertError } = await supabaseAdmin
        .from('loyalty_accounts')
        .upsert({ barberia_id: barberiaId, profile_id: profileId }, { onConflict: 'barberia_id,profile_id', ignoreDuplicates: true });
    if (upsertError) {
        console.error('No se pudo preparar la cuenta de fidelidad:', upsertError.message);
        return;
    }

    const { error: ledgerError } = await supabaseAdmin.from('loyalty_ledger').insert({
        barberia_id: barberiaId,
        profile_id: profileId,
        appointment_id: appointmentId,
        points_delta: puntos,
        reason: 'Cita completada',
    });
    if (ledgerError) console.error('No se pudieron otorgar los puntos de fidelidad:', ledgerError.message);
}

// El barbero marca la cita como completada: otorga puntos y pide una reseña.
export const completarCita = async (req, res) => {
    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, barberia_id, client_id, status, total')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

        const staffMembership = await esStaffDeLaBarberia(req.user.id, appointment.barberia_id);
        if (!staffMembership) return res.status(403).json({ error: 'No perteneces a esta barbería.' });
        if (!['confirmed', 'in_progress'].includes(appointment.status)) {
            return res.status(409).json({ error: 'Solo se puede completar una cita confirmada o en curso.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'completed' })
            .eq('id', appointment.id)
            .eq('status', appointment.status);
        if (updateError) throw updateError;

        await otorgarPuntosFidelidad(appointment.barberia_id, appointment.client_id, appointment.id, appointment.total);

        await notificar([{
            profile_id: appointment.client_id,
            type: 'appointment',
            title: '¡Gracias por tu visita!',
            body: 'Tu cita fue completada. Cuéntanos cómo te fue dejando una reseña.',
            action_url: '/opinion-barberia',
            data: { appointmentId: appointment.id },
        }]);

        await registrarAuditoria({
            barberiaId: appointment.barberia_id,
            actorId: req.user.id,
            action: 'appointment.complete',
            entityType: 'appointment',
            entityId: appointment.id,
            oldData: { status: appointment.status },
            newData: { status: 'completed', puntosOtorgados: Math.floor(Number(appointment.total)) },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al completar la cita:', error);
        res.status(500).json({ error: 'No fue posible completar la cita.' });
    }
};

// El cliente no se presentó.
export const marcarNoShow = async (req, res) => {
    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, barberia_id, client_id, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

        const staffMembership = await esStaffDeLaBarberia(req.user.id, appointment.barberia_id);
        if (!staffMembership) return res.status(403).json({ error: 'No perteneces a esta barbería.' });
        if (appointment.status !== 'confirmed') {
            return res.status(409).json({ error: 'Solo se puede marcar como no asistida una cita confirmada.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'no_show' })
            .eq('id', appointment.id)
            .eq('status', 'confirmed');
        if (updateError) throw updateError;

        await registrarAuditoria({
            barberiaId: appointment.barberia_id,
            actorId: req.user.id,
            action: 'appointment.no_show',
            entityType: 'appointment',
            entityId: appointment.id,
            oldData: { status: 'confirmed' },
            newData: { status: 'no_show' },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al marcar la cita como no asistida:', error);
        res.status(500).json({ error: 'No fue posible actualizar la cita.' });
    }
};

function round2(value) {
    return Math.round(value * 100) / 100;
}
