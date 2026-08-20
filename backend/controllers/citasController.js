import { supabaseAdmin } from '../config/supabase.js';
import { reembolsarPago } from './mercadoPagoController.js';
import { registrarIngresoPorPago } from './operacionController.js';
import { registrarAuditoria } from '../utils/auditoria.js';
import { validarCupon, otorgarCuponesElegibles } from '../utils/cupones.js';

const SLOT_MINUTES = 30;
const BLOCKING_STATUSES = ['pending_confirmation', 'confirmed', 'in_progress'];
// Anticipo fijo para todas las citas (por ahora); el resto se liquida en el local.
// Duplica la constante de mercadoPagoController.js — el flujo manual no depende del
// flujo automático de Mercado Pago, que se deja intacto pero sin usarse.
const ANTICIPO_FIJO_MXN = 100;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// Respeta los switches de Notificaciones del cliente (ajustes.jsx). Cada perfil tiene
// su fila garantizada por un trigger al crearse (ver
// DB/add_client_notification_preferences.sql), pero si por algo faltara, se asume que
// sí quiere la notificación (no perderla por un error de datos).
async function clienteQuierePreferencia(clientId, campo) {
    const { data, error } = await supabaseAdmin
        .from('client_notification_preferences')
        .select(campo)
        .eq('profile_id', clientId)
        .maybeSingle();
    if (error) {
        console.error('No se pudo consultar la preferencia de notificación:', error.message);
        return true;
    }
    return data ? data[campo] !== false : true;
}

// Igual que clienteQuierePreferencia, pero para los switches de Notificaciones del
// barbero (ajustes-barbero.jsx). Solo las memberships con role='barber' tienen fila en
// barber_notification_preferences (ver provision_barber_settings en el esquema); owner/admin
// no tienen switch para esto, así que si no hay fila se asume que sí quieren el aviso.
async function filtrarStaffPorPreferencia(barberiaId, profileIds, campo) {
    if (!profileIds.length) return [];
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('profile_id, barber_notification_preferences(new_appointment_alerts, cancellation_alerts, review_alerts, daily_summary_alerts)')
        .eq('barberia_id', barberiaId)
        .in('profile_id', profileIds);
    if (error) {
        console.error('No se pudo consultar las preferencias de notificación del staff:', error.message);
        return profileIds;
    }
    return (data ?? [])
        .filter((m) => m.barber_notification_preferences?.[campo] !== false)
        .map((m) => m.profile_id);
}

// Confirma que el usuario autenticado es owner/admin/barbero activo de la barbería,
// y de paso trae si la barbería está suspendida — control redundante: el login y
// useSuspensionGuard ya bloquean la sesión, pero una sesión ya abierta antes de la
// suspensión no debe poder seguir actuando sobre la API mientras tanto.
async function esStaffDeLaBarberia(userId, barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('id, role, barberias(is_suspended)')
        .eq('barberia_id', barberiaId)
        .eq('profile_id', userId)
        .eq('is_active', true)
        .maybeSingle();
    if (error) throw error;
    return data;
}

// El dueño desde Seguridad de la Plataforma puede apagarle a un admin/barbero el
// acceso a un módulo (ver DB/add_module_permissions_enforcement.sql); esto lo hace
// valer también en el backend, no solo en RLS. El dueño nunca se restringe a sí
// mismo, y si a alguien aún no se le configuró ningún permiso tiene acceso completo.
async function tieneAccesoModulo(userId, barberiaId, moduleCode, needManage = true) {
    const { data, error } = await supabaseAdmin.rpc('has_module_access', {
        p_barberia_id: barberiaId,
        p_module_code: moduleCode,
        p_need_manage: needManage,
        p_profile_id: userId,
    });
    if (error) throw error;
    return data === true;
}

// Calcula la ventana de minutos (0-1439) en que la barbería/barbero puede recibir citas
// para una fecha y weekday dados, combinando business_hours, staff_availability (si se
// especifica un barbero) y excepciones puntuales de fecha. Devuelve {windowStart:null,
// windowEnd:null} si está cerrado. Compartida entre obtenerDisponibilidad y crearCita,
// para que la reserva real respete exactamente las mismas reglas que la lista de
// horarios sugeridos (antes crearCita no validaba nada de esto).
async function calcularVentanaDisponible(barberiaId, barberMembershipId, fecha, weekday) {
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
        return { windowStart: null, windowEnd: null };
    }
    return { windowStart, windowEnd };
}

// -------------------- DISPONIBILIDAD --------------------
export const obtenerDisponibilidad = async (req, res) => {
    const { barberiaId, barberMembershipId, fecha, duracionMinutos } = req.query;
    if (!barberiaId || !fecha) {
        return res.status(400).json({ error: 'Faltan barberiaId o fecha.' });
    }
    // barberMembershipId se interpola directo en un filtro .or() de PostgREST más abajo
    // (endpoint público, sin sesión) — sin este chequeo, un valor con comas/paréntesis
    // podría inyectar condiciones extra al filtro (mismo hueco que ya se cerró en
    // utils/cupones.js con exigirUuid).
    if (barberMembershipId && !UUID_RE.test(barberMembershipId)) {
        return res.status(400).json({ error: 'barberMembershipId inválido.' });
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

        const { windowStart, windowEnd } = await calcularVentanaDisponible(barberiaId, barberMembershipId, fecha, weekday);

        if (windowStart === null || windowEnd === null) {
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
    // barberMembershipId se interpola directo en un filtro .or() dentro de
    // calcularVentanaDisponible más abajo — mismo chequeo defensivo que obtenerDisponibilidad.
    if (barberMembershipId && !UUID_RE.test(barberMembershipId)) {
        return res.status(400).json({ error: 'barberMembershipId inválido.' });
    }

    try {
        // Una cuenta anonimizada/eliminada (profiles.is_active = false) puede seguir
        // teniendo una sesión válida hasta que expire; esto bloquea que la use para
        // seguir agendando aunque el guard del frontend no la haya cerrado todavía.
        const { data: perfilCliente, error: perfilError } = await supabaseAdmin
            .from('profiles')
            .select('is_active')
            .eq('id', req.user.id)
            .maybeSingle();
        if (perfilError) throw perfilError;
        if (!perfilCliente || perfilCliente.is_active === false) {
            return res.status(403).json({ error: 'Tu cuenta fue eliminada. Contacta a soporte si crees que se trata de un error.' });
        }

        const { data: barberia, error: barberiaError } = await supabaseAdmin
            .from('barberias')
            .select('id, is_published, is_suspended, currency_code')
            .eq('id', barberiaId)
            .maybeSingle();
        if (barberiaError) throw barberiaError;
        if (!barberia || !barberia.is_published) {
            return res.status(404).json({ error: 'Barbería no encontrada.' });
        }
        if (barberia.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida y no puede recibir citas nuevas.' });
        }

        let autoAceptada = false;
        if (barberMembershipId) {
            const { data: membership, error: membershipError } = await supabaseAdmin
                .from('barberia_memberships')
                .select('id, role, is_active, barber_settings(accepting_appointments, auto_accept_appointments)')
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
            // Switch "Confirmación automática" de Ajustes: si el barbero elegido lo tiene
            // prendido, la solicitud se crea directo en pending_payment (como si él mismo
            // hubiera aceptado) en vez de esperar su revisión manual.
            autoAceptada = Boolean(membership.barber_settings?.auto_accept_appointments);
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

        // La cita debe caer dentro del horario de atención (y, si se eligió un barbero
        // específico, también dentro de su horario individual, sin excepciones que lo
        // cierren) — antes esto solo se aplicaba en la lista de horarios sugeridos
        // (obtenerDisponibilidad); llamando este endpoint directo se podía crear una cita
        // fuera de horario sin que nada lo bloqueara.
        const inicioCita = new Date(scheduledAt);
        if (Number.isNaN(inicioCita.getTime())) {
            return res.status(400).json({ error: 'scheduledAt inválido.' });
        }
        const fechaCita = scheduledAt.slice(0, 10);
        const weekdayCita = new Date(`${fechaCita}T00:00:00Z`).getUTCDay();
        const inicioMinutosCita = inicioCita.getUTCHours() * 60 + inicioCita.getUTCMinutes();
        const finMinutosCita = inicioMinutosCita + totalDuration;

        const ventana = await calcularVentanaDisponible(barberiaId, barberMembershipId || null, fechaCita, weekdayCita);
        if (ventana.windowStart === null || inicioMinutosCita < ventana.windowStart || finMinutosCita > ventana.windowEnd) {
            return res.status(409).json({ error: 'Ese horario está fuera del horario de atención de la barbería.' });
        }

        let discountTotal = 0;
        let coupon = null;
        if (couponCode) {
            try {
                const resultado = await validarCupon({
                    couponCode,
                    barberiaId,
                    clientId: req.user.id,
                    subtotal,
                    serviceIds: uniqueServiceIds,
                    barberMembershipId: barberMembershipId || null,
                    scheduledAt,
                });
                coupon = resultado.coupon;
                discountTotal = resultado.discountTotal;
            } catch (err) {
                return res.status(err.status || 500).json({ error: err.message });
            }
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
                // solicitud (salvo que el barbero tenga "Confirmación automática" activada,
                // ver autoAceptada arriba). Este mismo estado también bloquea el horario
                // para otros clientes (ver appointments_no_barber_overlap en el esquema SQL).
                status: autoAceptada ? 'pending_payment' : 'pending_confirmation',
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
            // redimir_cupon revalida los límites de uso Y hace el insert en una sola
            // transacción con bloqueo de fila (ver DB/add_redimir_cupon_atomico.sql) —
            // cierra la ventana de carrera que dejaba el conteo aparte de validarCupon.
            const { error: redemptionError } = await supabaseAdmin.rpc('redimir_cupon', {
                p_coupon_id: coupon.id,
                p_client_id: req.user.id,
                p_appointment_id: appointment.id,
                p_discount_amount: discountTotal,
            });
            if (redemptionError) {
                await supabaseAdmin.from('appointment_services').delete().eq('appointment_id', appointment.id);
                await supabaseAdmin.from('appointments').delete().eq('id', appointment.id);
                if (redemptionError.message?.includes('coupon_usage_limit_reached') || redemptionError.message?.includes('coupon_client_limit_reached')) {
                    return res.status(409).json({ error: 'Este cupón ya alcanzó su límite de usos.' });
                }
                throw redemptionError;
            }
        }

        const staffIds = await obtenerStaffActivo(barberiaId);
        const staffQueQuiereAviso = await filtrarStaffPorPreferencia(barberiaId, staffIds, 'new_appointment_alerts');
        await notificar(
            staffQueQuiereAviso.map((profileId) => ({
                profile_id: profileId,
                type: 'appointment',
                title: autoAceptada ? 'Nueva cita confirmada automáticamente' : 'Nueva solicitud de cita',
                body: autoAceptada
                    ? `Se confirmó automáticamente una cita para el ${new Date(scheduledAt).toLocaleString('es-MX')}.`
                    : `Tienes una nueva solicitud para el ${new Date(scheduledAt).toLocaleString('es-MX')}. Revísala para aceptarla o rechazarla.`,
                action_url: `/barbero/citas`,
                data: { appointmentId: appointment.id },
            }))
        );

        if (autoAceptada) {
            // Con "Confirmación automática" no hay revisión manual (aceptarCita nunca se
            // llama), así que el cliente recibe aquí mismo el aviso que normalmente le
            // llegaría cuando el barbero aprueba la solicitud.
            await notificar([{
                profile_id: req.user.id,
                type: 'appointment',
                title: '¡Tu cita fue aceptada!',
                body: 'Tu solicitud se confirmó automáticamente. Realiza el pago del anticipo para asegurar tu horario.',
                action_url: '/mis-citas',
                data: { appointmentId: appointment.id },
            }]);
        }

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
            .select('id, provider, provider_payment_id, amount')
            .eq('appointment_id', appointment.id)
            .eq('status', 'approved')
            .maybeSingle();
        if (paymentError) throw paymentError;

        let reembolsoManual = false;
        if (payment) {
            if (payment.provider === 'manual_link') {
                // Se pagó con el link manual del owner: no hay API para reembolsar solo,
                // se marca reembolsado y el owner debe hacerlo aparte desde su cuenta de
                // Mercado Pago.
                const { error: manualRefundError } = await supabaseAdmin
                    .from('payments')
                    .update({ status: 'refunded' })
                    .eq('id', payment.id);
                if (manualRefundError) throw manualRefundError;
                reembolsoManual = true;
            } else {
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
        }

        // El estado se vuelve a filtrar aquí (no solo arriba, al leerlo) porque entre esa
        // lectura y este UPDATE puede pasar la llamada a Mercado Pago para el reembolso —
        // una ventana real donde el barbero podría aceptar/completar la cita en paralelo.
        // Sin este filtro, este UPDATE la pisaba sin importar en qué estado hubiera quedado
        // mientras tanto (ej. podía cancelar una cita que ya se había marcado "completed").
        const { data: filasCanceladas, error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({
                status: 'cancelled',
                cancelled_at: new Date().toISOString(),
                cancelled_by: req.user.id,
                cancellation_reason: motivo || 'Cancelada por el cliente',
            })
            .eq('id', appointment.id)
            .eq('status', appointment.status)
            .select('id');
        if (updateError) throw updateError;
        if (!filasCanceladas?.length) {
            return res.status(409).json({ error: 'Esta cita cambió de estado justo ahora y ya no se puede cancelar. Actualiza la página.' });
        }

        const staffIds = await obtenerStaffActivo(appointment.barberia_id);
        const staffQueQuiereAviso = await filtrarStaffPorPreferencia(appointment.barberia_id, staffIds, 'cancellation_alerts');
        await notificar(
            staffQueQuiereAviso.map((profileId) => ({
                profile_id: profileId,
                type: 'appointment',
                title: 'Cita cancelada por el cliente',
                body: reembolsoManual
                    ? 'El cliente canceló su cita. Ya pagó el anticipo por el link manual — recuerda reembolsarlo tú mismo desde tu cuenta de Mercado Pago.'
                    : payment
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

// -------------------- PAGO MANUAL (link de la barbería + comprobante) --------------------
// Mientras no haya credenciales de la API de Mercado Pago, el anticipo se paga con el
// link que cada barbería configura en su perfil; el cliente sube un comprobante y el
// barbero/owner lo revisa a mano. El flujo automático (crearPreferencia + webhook en
// mercadoPagoController.js) se deja intacto y sin usarse, listo para el día que sí den
// las credenciales.

// El cliente ya pagó con el link manual y sube su comprobante (la imagen ya se subió a
// Storage desde el frontend; aquí solo se registra la ruta y se avisa al staff).
export const subirComprobante = async (req, res) => {
    const { proofPath } = req.body;
    if (!proofPath) {
        return res.status(400).json({ error: 'Falta proofPath.' });
    }

    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, barberia_id, client_id, status, barberia:barberias(currency_code)')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });
        if (appointment.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Esta cita no te pertenece.' });
        }
        if (appointment.status !== 'pending_payment') {
            return res.status(409).json({ error: 'Esta cita no está esperando un pago.' });
        }
        // El path debe vivir dentro de la carpeta de ESTA cita (comprobantes/{id}/...). Sin
        // este chequeo, el cliente podría mandar el proofPath de un comprobante real de OTRA
        // cita suya ya pagada (RLS solo exige que sea su propio client_id) y reusar ese mismo
        // comprobante para "pagar" varias citas sin volver a pagar de verdad.
        if (!proofPath.startsWith(`${appointment.id}/`)) {
            return res.status(400).json({ error: 'El comprobante no corresponde a esta cita.' });
        }

        const { data: existente, error: existenteError } = await supabaseAdmin
            .from('payments')
            .select('id, status')
            .eq('appointment_id', appointment.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (existenteError) throw existenteError;

        if (existente && existente.status !== 'rejected') {
            return res.status(409).json({ error: 'Ya hay un comprobante en revisión para esta cita.' });
        }

        if (existente) {
            const { error: updateError } = await supabaseAdmin
                .from('payments')
                .update({ proof_image_path: proofPath, status: 'pending_review' })
                .eq('id', existente.id);
            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabaseAdmin.from('payments').insert({
                appointment_id: appointment.id,
                payer_id: req.user.id,
                provider: 'manual_link',
                amount: ANTICIPO_FIJO_MXN,
                currency_code: appointment.barberia?.currency_code || 'MXN',
                status: 'pending_review',
                proof_image_path: proofPath,
            });
            if (insertError) throw insertError;
        }

        const staffIds = await obtenerStaffActivo(appointment.barberia_id);
        await notificar(
            staffIds.map((profileId) => ({
                profile_id: profileId,
                type: 'payment',
                title: 'Comprobante de pago recibido',
                body: 'Un cliente subió su comprobante de anticipo. Revísalo para confirmar la cita.',
                action_url: '/barbero/citas',
                data: { appointmentId: appointment.id },
            }))
        );

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al registrar el comprobante:', error);
        res.status(500).json({ error: 'No fue posible registrar el comprobante.' });
    }
};

// El barbero/admin revisó el comprobante y confirma que el pago sí llegó.
export const confirmarPagoManual = async (req, res) => {
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
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!(await tieneAccesoModulo(req.user.id, appointment.barberia_id, 'pagos'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Pagos.' });
        }
        if (appointment.status !== 'pending_payment') {
            return res.status(409).json({ error: 'Esta cita no está esperando un pago.' });
        }

        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .select('id, amount')
            .eq('appointment_id', appointment.id)
            .eq('status', 'pending_review')
            .maybeSingle();
        if (paymentError) throw paymentError;
        if (!payment) return res.status(409).json({ error: 'No hay ningún comprobante pendiente de revisión.' });

        const { error: paymentUpdateError } = await supabaseAdmin
            .from('payments')
            .update({ status: 'approved', paid_at: new Date().toISOString() })
            .eq('id', payment.id);
        if (paymentUpdateError) throw paymentUpdateError;

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'pending_confirmation' })
            .eq('id', appointment.id)
            .eq('status', 'pending_payment');
        if (updateError) throw updateError;

        await registrarIngresoPorPago({
            barberiaId: appointment.barberia_id,
            paymentId: payment.id,
            amount: payment.amount,
            appointmentId: appointment.id,
        });

        const staffIds = await obtenerStaffActivo(appointment.barberia_id);
        await notificar(
            staffIds.filter((id) => id !== req.user.id).map((profileId) => ({
                profile_id: profileId,
                type: 'payment',
                title: 'Anticipo confirmado',
                body: 'El pago ya se verificó. Confírmale la cita al 100% para dejarla lista.',
                action_url: '/barbero/citas',
                data: { appointmentId: appointment.id },
            }))
        );

        await registrarAuditoria({
            barberiaId: appointment.barberia_id,
            actorId: req.user.id,
            action: 'payment.confirm_manual',
            entityType: 'payment',
            entityId: payment.id,
            newData: { status: 'approved' },
        });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al confirmar el pago manual:', error);
        res.status(500).json({ error: 'No fue posible confirmar el pago.' });
    }
};

// El barbero/admin rechaza el comprobante (no se ve claro, monto incorrecto, etc.);
// el cliente puede subir uno nuevo para la misma cita.
export const rechazarComprobante = async (req, res) => {
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
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!(await tieneAccesoModulo(req.user.id, appointment.barberia_id, 'pagos'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Pagos.' });
        }

        const { data: payment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .select('id')
            .eq('appointment_id', appointment.id)
            .eq('status', 'pending_review')
            .maybeSingle();
        if (paymentError) throw paymentError;
        if (!payment) return res.status(409).json({ error: 'No hay ningún comprobante pendiente de revisión.' });

        const { error: updateError } = await supabaseAdmin
            .from('payments')
            .update({ status: 'rejected' })
            .eq('id', payment.id);
        if (updateError) throw updateError;

        await notificar([{
            profile_id: appointment.client_id,
            type: 'payment',
            title: 'Tu comprobante no pudo verificarse',
            body: motivo || 'Revisa que la imagen sea clara y el monto correcto, y súbelo de nuevo.',
            action_url: '/mis-citas',
            data: { appointmentId: appointment.id },
        }]);

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al rechazar el comprobante:', error);
        res.status(500).json({ error: 'No fue posible rechazar el comprobante.' });
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
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!(await tieneAccesoModulo(req.user.id, appointment.barberia_id, 'agenda'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Agenda.' });
        }
        if (appointment.status !== 'pending_confirmation') {
            return res.status(409).json({ error: 'Esta solicitud ya no está pendiente de revisión.' });
        }

        const { data: filasAceptadas, error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'pending_payment' })
            .eq('id', appointment.id)
            .eq('status', 'pending_confirmation')
            .select('id');
        if (updateError) throw updateError;
        if (!filasAceptadas?.length) {
            return res.status(409).json({ error: 'Esta solicitud ya fue actualizada por otra acción.' });
        }

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
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!(await tieneAccesoModulo(req.user.id, appointment.barberia_id, 'agenda'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Agenda.' });
        }
        if (!['pending_confirmation', 'pending_payment'].includes(appointment.status)) {
            return res.status(409).json({ error: 'Esta cita ya no se puede rechazar.' });
        }

        const { data: filasRechazadas, error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({
                status: 'rejected',
                cancelled_at: new Date().toISOString(),
                cancelled_by: req.user.id,
                cancellation_reason: motivo || 'Rechazada por la barbería.',
            })
            .eq('id', appointment.id)
            .eq('status', appointment.status)
            .select('id');
        if (updateError) throw updateError;
        if (!filasRechazadas?.length) {
            return res.status(409).json({ error: 'Esta cita cambió de estado justo ahora y ya no se puede rechazar. Actualiza la página.' });
        }

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
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!(await tieneAccesoModulo(req.user.id, appointment.barberia_id, 'agenda'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Agenda.' });
        }
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

        const { data: filasConfirmadas, error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'confirmed' })
            .eq('id', appointment.id)
            .eq('status', 'pending_confirmation')
            .select('id');
        if (updateError) throw updateError;
        if (!filasConfirmadas?.length) {
            return res.status(409).json({ error: 'Esta cita ya fue confirmada por otra acción.' });
        }

        if (await clienteQuierePreferencia(appointment.client_id, 'appointment_confirmed_alerts')) {
            await notificar([{
                profile_id: appointment.client_id,
                type: 'appointment',
                title: '¡Tu cita quedó confirmada al 100%!',
                body: 'La barbería confirmó tu cita. Te esperamos en tu horario reservado.',
                action_url: '/mis-citas',
                data: { appointmentId: appointment.id },
            }]);
        }

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
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!(await tieneAccesoModulo(req.user.id, appointment.barberia_id, 'agenda'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Agenda.' });
        }
        if (appointment.status !== 'confirmed') {
            return res.status(409).json({ error: 'Solo se puede iniciar una cita ya confirmada.' });
        }

        const { data: filasIniciadas, error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'in_progress' })
            .eq('id', appointment.id)
            .eq('status', 'confirmed')
            .select('id');
        if (updateError) throw updateError;
        if (!filasIniciadas?.length) {
            return res.status(409).json({ error: 'Esta cita ya fue actualizada por otra acción.' });
        }

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

// El owner/admin consulta cuántos puntos se otorgaron este mes. loyalty_ledger no tiene
// políticas RLS de lectura para nadie (ver comentario arriba), así que el frontend no puede
// leerla directo — tiene que pasar por aquí, con la llave de servicio.
export const obtenerResumenFidelidad = async (req, res) => {
    try {
        const staffMembership = await supabaseAdmin
            .from('barberia_memberships')
            .select('barberia_id')
            .eq('profile_id', req.user.id)
            .in('role', ['owner', 'admin'])
            .eq('is_active', true)
            .maybeSingle();
        if (staffMembership.error) throw staffMembership.error;
        if (!staffMembership.data) return res.status(403).json({ error: 'No perteneces a ninguna barbería como dueño o administrador.' });

        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const { data: ledger, error: ledgerError } = await supabaseAdmin
            .from('loyalty_ledger')
            .select('points_delta')
            .eq('barberia_id', staffMembership.data.barberia_id)
            .gte('created_at', inicioMes.toISOString());
        if (ledgerError) throw ledgerError;

        const puntosDelMes = (ledger ?? []).reduce((acc, l) => acc + l.points_delta, 0);
        res.json({ puntosDelMes });
    } catch (error) {
        console.error('Error al obtener el resumen de fidelidad:', error);
        res.status(500).json({ error: 'No fue posible obtener el resumen de fidelidad.' });
    }
};

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
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!(await tieneAccesoModulo(req.user.id, appointment.barberia_id, 'agenda'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Agenda.' });
        }
        if (!['confirmed', 'in_progress'].includes(appointment.status)) {
            return res.status(409).json({ error: 'Solo se puede completar una cita confirmada o en curso.' });
        }

        // El filtro .eq('status', appointment.status) ya evita que dos "Completar" en
        // paralelo dejen la cita en un estado raro, pero por sí solo no basta: un UPDATE
        // que no matchea ninguna fila no cuenta como error para PostgREST, así que sin
        // este chequeo ambas solicitudes seguían de largo y otorgaban puntos de fidelidad
        // dos veces por la misma cita (loyalty_ledger no tiene restricción única por cita).
        const { data: filasCompletadas, error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'completed' })
            .eq('id', appointment.id)
            .eq('status', appointment.status)
            .select('id');
        if (updateError) throw updateError;
        if (!filasCompletadas?.length) {
            return res.status(409).json({ error: 'Esta cita ya fue actualizada por otra acción. Actualiza la página.' });
        }

        await otorgarPuntosFidelidad(appointment.barberia_id, appointment.client_id, appointment.id, appointment.total);
        await otorgarCuponesElegibles(appointment.barberia_id, appointment.client_id);

        await notificar([{
            profile_id: appointment.client_id,
            type: 'appointment',
            title: '¡Gracias por tu visita!',
            body: 'Tu cita fue completada. Cuéntanos cómo te fue dejando una reseña.',
            action_url: '/historial-citas',
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

// El barbero/admin oculta de su agenda una cita ya terminal (cancelada, rechazada,
// no asistida o completada). No borra el registro: pagos, reseñas y reportes del
// owner siguen intactos, solo deja de listarse en la agenda del barbero.
const ESTADOS_OCULTABLES = ['cancelled', 'rejected', 'no_show', 'completed'];

export const ocultarCita = async (req, res) => {
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
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!(await tieneAccesoModulo(req.user.id, appointment.barberia_id, 'agenda'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Agenda.' });
        }
        if (!ESTADOS_OCULTABLES.includes(appointment.status)) {
            return res.status(409).json({ error: 'Solo se pueden ocultar citas canceladas, rechazadas, no asistidas o completadas.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ hidden_by_barber_at: new Date().toISOString() })
            .eq('id', appointment.id);
        if (updateError) throw updateError;

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al ocultar la cita:', error);
        res.status(500).json({ error: 'No fue posible ocultar la cita.' });
    }
};

// Igual que ocultarCita, pero del lado del cliente: quita una cita terminal de su
// propio Historial sin borrar el registro real (la barbería conserva su contabilidad).
export const ocultarCitaCliente = async (req, res) => {
    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, client_id, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });
        if (appointment.client_id !== req.user.id) {
            return res.status(403).json({ error: 'Esta cita no te pertenece.' });
        }
        if (!ESTADOS_OCULTABLES.includes(appointment.status)) {
            return res.status(409).json({ error: 'Solo se pueden ocultar citas canceladas, rechazadas, no asistidas o completadas.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ hidden_by_client_at: new Date().toISOString() })
            .eq('id', appointment.id);
        if (updateError) throw updateError;

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al ocultar la cita del historial:', error);
        res.status(500).json({ error: 'No fue posible ocultar la cita.' });
    }
};

// Igual que ocultarCita, pero solo para owner/admin desde Gestión de Agenda: aceptar o
// rechazar una cita es trabajo del barbero (ver owner-agenda.jsx), así que su lista de
// "Canceladas y rechazadas recientes" tiene su propio hidden_by_owner_at, independiente
// de lo que el barbero oculte o no de su propia agenda.
export const ocultarCitaOwner = async (req, res) => {
    try {
        const { data: appointment, error: fetchError } = await supabaseAdmin
            .from('appointments')
            .select('id, barberia_id, status')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

        const staffMembership = await esStaffDeLaBarberia(req.user.id, appointment.barberia_id);
        if (!staffMembership || !['owner', 'admin'].includes(staffMembership.role)) {
            return res.status(403).json({ error: 'Solo el dueño o un administrador puede ocultar citas de Gestión de Agenda.' });
        }
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!ESTADOS_OCULTABLES.includes(appointment.status)) {
            return res.status(409).json({ error: 'Solo se pueden ocultar citas canceladas, rechazadas, no asistidas o completadas.' });
        }

        const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ hidden_by_owner_at: new Date().toISOString() })
            .eq('id', appointment.id);
        if (updateError) throw updateError;

        res.json({ ok: true });
    } catch (error) {
        console.error('Error al ocultar la cita del owner:', error);
        res.status(500).json({ error: 'No fue posible ocultar la cita.' });
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
        if (staffMembership.barberias?.is_suspended) {
            return res.status(403).json({ error: 'Esta barbería está temporalmente suspendida por falta de pago.' });
        }
        if (!(await tieneAccesoModulo(req.user.id, appointment.barberia_id, 'agenda'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Agenda.' });
        }
        if (appointment.status !== 'confirmed') {
            return res.status(409).json({ error: 'Solo se puede marcar como no asistida una cita confirmada.' });
        }

        const { data: filasNoShow, error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ status: 'no_show' })
            .eq('id', appointment.id)
            .eq('status', 'confirmed')
            .select('id');
        if (updateError) throw updateError;
        if (!filasNoShow?.length) {
            return res.status(409).json({ error: 'Esta cita ya fue actualizada por otra acción.' });
        }

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

// Corre una vez al día: le avisa al cliente de sus citas confirmadas para "mañana"
// (siguiente día calendario) que todavía no tengan recordatorio mandado, y solo si
// tiene activado el switch "Recordatorio de cita" en Ajustes. No existía ninguna
// función que hiciera esto — el switch estaba conectado a nada.
export async function enviarRecordatoriosDeCitas() {
    const inicioManana = new Date();
    inicioManana.setDate(inicioManana.getDate() + 1);
    inicioManana.setHours(0, 0, 0, 0);
    const finManana = new Date(inicioManana);
    finManana.setHours(23, 59, 59, 999);

    const { data: citas, error } = await supabaseAdmin
        .from('appointments')
        .select('id, client_id, scheduled_at, barberias(name), appointment_services(service_name)')
        .eq('status', 'confirmed')
        .is('reminder_sent_at', null)
        .gte('scheduled_at', inicioManana.toISOString())
        .lte('scheduled_at', finManana.toISOString());
    if (error) {
        console.error('No se pudieron buscar los recordatorios de citas:', error.message);
        return;
    }
    if (!citas?.length) return;

    for (const cita of citas) {
        if (!(await clienteQuierePreferencia(cita.client_id, 'appointment_reminders'))) {
            // No quiere recordatorios, pero igual se marca como "atendida" para no
            // volver a evaluarla cada día hasta que pase la fecha.
            await supabaseAdmin.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', cita.id);
            continue;
        }

        const hora = new Date(cita.scheduled_at).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true });
        const { error: notifError } = await supabaseAdmin.from('notifications').insert({
            profile_id: cita.client_id,
            type: 'appointment',
            title: '⏰ Tu cita es mañana',
            body: `${cita.appointment_services?.[0]?.service_name ?? 'Tu servicio'} en ${cita.barberias?.name ?? 'la barbería'} a las ${hora}.`,
            action_url: '/mis-citas',
            data: { appointmentId: cita.id },
        });
        if (notifError) {
            console.error('No se pudo enviar el recordatorio de cita:', notifError.message);
            continue;
        }
        await supabaseAdmin.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', cita.id);
    }
}

// Corre una vez al día, temprano: le manda a cada barbero con "Resumen diario" activado
// (switch en Ajustes) un aviso con sus citas confirmadas de hoy. Igual que con
// enviarRecordatoriosDeCitas, el switch no tenía ninguna función detrás.
export async function enviarResumenDiario() {
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(inicioHoy);
    finHoy.setHours(23, 59, 59, 999);

    const { data: preferencias, error } = await supabaseAdmin
        .from('barber_notification_preferences')
        .select('membership_id')
        .eq('daily_summary_alerts', true);
    if (error) {
        console.error('No se pudo buscar a quién mandarle el resumen diario:', error.message);
        return;
    }
    if (!preferencias?.length) return;

    const { data: memberships, error: membershipsError } = await supabaseAdmin
        .from('barberia_memberships')
        .select('id, profile_id')
        .eq('is_active', true)
        .in('id', preferencias.map((p) => p.membership_id));
    if (membershipsError) {
        console.error('No se pudo obtener el staff para el resumen diario:', membershipsError.message);
        return;
    }

    for (const membership of memberships ?? []) {
        const { data: citas, error: citasError } = await supabaseAdmin
            .from('appointments')
            .select('id, scheduled_at')
            .eq('barber_membership_id', membership.id)
            .eq('status', 'confirmed')
            .gte('scheduled_at', inicioHoy.toISOString())
            .lte('scheduled_at', finHoy.toISOString())
            .order('scheduled_at', { ascending: true });
        if (citasError) {
            console.error('No se pudo obtener las citas del resumen diario:', citasError.message);
            continue;
        }

        const cantidad = citas?.length ?? 0;
        const body = cantidad === 0
            ? 'No tienes citas confirmadas para hoy.'
            : `Tienes ${cantidad} cita${cantidad === 1 ? '' : 's'} confirmada${cantidad === 1 ? '' : 's'} hoy. La primera es a las ${new Date(citas[0].scheduled_at).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true })}.`;

        const { error: notifError } = await supabaseAdmin.from('notifications').insert({
            profile_id: membership.profile_id,
            type: 'appointment',
            title: '🗓️ Tu agenda de hoy',
            body,
            action_url: '/barbero/citas',
            data: { cantidad },
        });
        if (notifError) console.error('No se pudo enviar el resumen diario:', notifError.message);
    }
}
