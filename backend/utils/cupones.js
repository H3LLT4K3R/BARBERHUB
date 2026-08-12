import { supabaseAdmin } from '../config/supabase.js';

function round2(value) {
    return Math.round(value * 100) / 100;
}

function errorHttp(message, status) {
    return Object.assign(new Error(message), { status });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// barberiaId se interpola directo en un filtro .or() de PostgREST más abajo — sin este
// chequeo, un barberiaId con comas/paréntesis podría inyectar condiciones extra al
// filtro y saltarse el alcance de la barbería (ver validarCupon/otorgarCuponesElegibles).
function exigirUuid(valor, etiqueta) {
    if (!UUID_RE.test(valor)) throw errorHttp(`${etiqueta} inválido.`, 400);
}

async function contarVisitasYGasto(clientId, barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('appointments')
        .select('total')
        .eq('client_id', clientId)
        .eq('barberia_id', barberiaId)
        .eq('status', 'completed');
    if (error) throw error;
    const filas = data ?? [];
    return {
        visitas: filas.length,
        gasto: filas.reduce((sum, a) => sum + Number(a.total), 0),
    };
}

const aMinutos = (hora) => {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
};

// Reglas de segmentación (servicio/barbero/visitas/gasto/día-hora) y el plazo
// personal de canje (coupon_claims), además de las básicas que ya vivían en crearCita.
async function validarReglasExtra(coupon, { clientId, barberiaId, serviceIds, barberMembershipId, scheduledAt }) {
    if (coupon.service_id && !serviceIds.includes(coupon.service_id)) {
        return 'Este cupón solo aplica a un servicio específico que no está en tu reserva.';
    }
    if (coupon.barber_membership_id && coupon.barber_membership_id !== barberMembershipId) {
        return 'Este cupón solo aplica si reservas con un barbero en particular.';
    }

    if (scheduledAt) {
        const fecha = new Date(scheduledAt);
        if (coupon.valid_weekdays?.length && !coupon.valid_weekdays.includes(fecha.getUTCDay())) {
            return 'Este cupón no es válido para el día que elegiste.';
        }
        if (coupon.valid_time_start || coupon.valid_time_end) {
            const minutos = fecha.getUTCHours() * 60 + fecha.getUTCMinutes();
            if (coupon.valid_time_start && minutos < aMinutos(coupon.valid_time_start)) {
                return 'Este cupón no es válido en ese horario.';
            }
            if (coupon.valid_time_end && minutos > aMinutos(coupon.valid_time_end)) {
                return 'Este cupón no es válido en ese horario.';
            }
        }
    }

    if (coupon.minimum_visits != null || coupon.maximum_visits != null || coupon.minimum_spent != null) {
        const { visitas, gasto } = await contarVisitasYGasto(clientId, barberiaId);
        if (coupon.minimum_visits != null && visitas < coupon.minimum_visits) {
            return 'Este cupón es exclusivo para clientes frecuentes.';
        }
        if (coupon.maximum_visits != null && visitas > coupon.maximum_visits) {
            return 'Este cupón es exclusivo para clientes nuevos.';
        }
        if (coupon.minimum_spent != null && gasto < Number(coupon.minimum_spent)) {
            return 'Este cupón requiere un gasto acumulado mínimo en esta barbería.';
        }
    }

    // Si al cliente ya se le notificó este cupón (coupon_claims), su plazo personal
    // manda sobre la fecha general del cupón. Si no existe el claim todavía, no se
    // bloquea aquí — el cupón puede seguir siendo de uso abierto.
    const { data: claim, error: claimError } = await supabaseAdmin
        .from('coupon_claims')
        .select('expires_at')
        .eq('coupon_id', coupon.id)
        .eq('client_id', clientId)
        .maybeSingle();
    if (claimError) throw claimError;
    if (claim && new Date(claim.expires_at) < new Date()) {
        return 'Tu plazo para canjear este cupón ya venció.';
    }

    return null;
}

// Busca, valida y calcula el descuento de un cupón para una barbería/cliente/carrito
// dados. Usada tanto por el preview (POST /citas/validar-cupon) como por crearCita.
export async function validarCupon({ couponCode, barberiaId, clientId, subtotal, serviceIds, barberMembershipId, scheduledAt }) {
    exigirUuid(barberiaId, 'barberiaId');
    const nowIso = new Date().toISOString();
    const { data: foundCoupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .lte('starts_at', nowIso)
        .gte('ends_at', nowIso)
        .or(`barberia_id.eq.${barberiaId},is_platform_wide.eq.true`)
        .maybeSingle();
    if (couponError) throw errorHttp('No fue posible validar el cupón.', 500);
    if (!foundCoupon) throw errorHttp('Cupón inválido o expirado.', 400);

    if (subtotal < Number(foundCoupon.minimum_subtotal)) {
        throw errorHttp(`Este cupón requiere un mínimo de $${foundCoupon.minimum_subtotal}.`, 400);
    }

    if (foundCoupon.usage_limit) {
        const { count, error: usageError } = await supabaseAdmin
            .from('coupon_redemptions')
            .select('id', { count: 'exact', head: true })
            .eq('coupon_id', foundCoupon.id);
        if (usageError) throw errorHttp('No fue posible validar el cupón.', 500);
        if (count >= foundCoupon.usage_limit) {
            throw errorHttp('Este cupón ya alcanzó su límite de usos.', 400);
        }
    }

    const { count: clientUsage, error: clientUsageError } = await supabaseAdmin
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', foundCoupon.id)
        .eq('client_id', clientId);
    if (clientUsageError) throw errorHttp('No fue posible validar el cupón.', 500);
    if (clientUsage >= foundCoupon.per_client_limit) {
        throw errorHttp('Ya usaste este cupón el máximo de veces permitido.', 400);
    }

    const errorRegla = await validarReglasExtra(foundCoupon, { clientId, barberiaId, serviceIds, barberMembershipId, scheduledAt });
    if (errorRegla) throw errorHttp(errorRegla, 400);

    const rawDiscount = foundCoupon.discount_type === 'percent'
        ? subtotal * (Number(foundCoupon.discount_value) / 100)
        : Number(foundCoupon.discount_value);
    const cappedDiscount = foundCoupon.maximum_discount
        ? Math.min(rawDiscount, Number(foundCoupon.maximum_discount))
        : rawDiscount;
    const discountTotal = round2(Math.min(cappedDiscount, subtotal));

    return { coupon: foundCoupon, discountTotal };
}

// Se llama cuando una cita pasa a completed: revisa si el cliente ahora califica para
// algún cupón "acumulativo" (mínimo de visitas y/o gasto) de esa barbería que todavía
// no le habíamos notificado, y si es así crea su coupon_claims (arranca su plazo
// personal de canje) + una notificación tipo promotion.
export async function otorgarCuponesElegibles(barberiaId, clientId) {
    // barberiaId aquí siempre viene de appointments.barberia_id (columna uuid, no de
    // input directo del cliente), pero se valida igual antes de interpolarlo en el
    // filtro .or() de abajo, por consistencia con validarCupon.
    if (!UUID_RE.test(barberiaId)) {
        console.error('otorgarCuponesElegibles recibió un barberiaId inválido:', barberiaId);
        return;
    }
    const { data: candidatos, error: candidatosError } = await supabaseAdmin
        .from('coupons')
        .select('id, code, description, redemption_window_days, minimum_visits, minimum_spent')
        .or(`barberia_id.eq.${barberiaId},is_platform_wide.eq.true`)
        .eq('is_active', true)
        .gte('ends_at', new Date().toISOString())
        .or('minimum_visits.not.is.null,minimum_spent.not.is.null');
    if (candidatosError) {
        console.error('No se pudieron revisar los cupones elegibles:', candidatosError.message);
        return;
    }
    if (!candidatos?.length) return;

    const { data: yaNotificados, error: claimsError } = await supabaseAdmin
        .from('coupon_claims')
        .select('coupon_id')
        .eq('client_id', clientId)
        .in('coupon_id', candidatos.map((c) => c.id));
    if (claimsError) {
        console.error('No se pudieron revisar los claims existentes:', claimsError.message);
        return;
    }
    const idsYaNotificados = new Set((yaNotificados ?? []).map((c) => c.coupon_id));
    const pendientes = candidatos.filter((c) => !idsYaNotificados.has(c.id));
    if (!pendientes.length) return;

    const { visitas, gasto } = await contarVisitasYGasto(clientId, barberiaId);

    const ahora = new Date();
    for (const cupon of pendientes) {
        const cumpleVisitas = cupon.minimum_visits == null || visitas >= cupon.minimum_visits;
        const cumpleGasto = cupon.minimum_spent == null || gasto >= Number(cupon.minimum_spent);
        if (!cumpleVisitas || !cumpleGasto) continue;

        const expiresAt = new Date(ahora.getTime() + cupon.redemption_window_days * 24 * 60 * 60 * 1000);
        const { error: claimInsertError } = await supabaseAdmin.from('coupon_claims').insert({
            coupon_id: cupon.id,
            client_id: clientId,
            notified_at: ahora.toISOString(),
            expires_at: expiresAt.toISOString(),
        });
        if (claimInsertError) {
            console.error('No se pudo registrar el claim del cupón:', claimInsertError.message);
            continue;
        }

        const { error: notifError } = await supabaseAdmin.from('notifications').insert({
            profile_id: clientId,
            type: 'promotion',
            title: '🎉 Tienes un cupón disponible',
            body: `${cupon.description || cupon.code}. Tienes ${cupon.redemption_window_days} días para usarlo.`,
            action_url: '/mis-citas',
            data: { couponId: cupon.id, couponCode: cupon.code },
        });
        if (notifError) console.error('No se pudo notificar el cupón:', notifError.message);
    }
}

// Corre una vez al día: a quien le quedan exactamente 2 días para que se le venza su
// cupón (día 5 de un plazo de 7) y todavía no se le ha recordado, se le avisa.
// Se basa en expires_at, no en "notified_at + N días fijos", para que siga funcionando
// aunque algún cupón use un redemption_window_days distinto al default de 7.
const DIAS_ANTES_DE_VENCER = 2;

export async function enviarRecordatoriosDeCupones() {
    const objetivo = new Date(Date.now() + DIAS_ANTES_DE_VENCER * 24 * 60 * 60 * 1000);
    const inicioDelDia = new Date(objetivo);
    inicioDelDia.setUTCHours(0, 0, 0, 0);
    const finDelDia = new Date(objetivo);
    finDelDia.setUTCHours(23, 59, 59, 999);

    const { data: claims, error } = await supabaseAdmin
        .from('coupon_claims')
        .select('id, client_id, expires_at, coupons(code, description)')
        .is('reminder_sent_at', null)
        .gte('expires_at', inicioDelDia.toISOString())
        .lte('expires_at', finDelDia.toISOString());
    if (error) {
        console.error('No se pudieron buscar los recordatorios de cupones:', error.message);
        return;
    }
    if (!claims?.length) return;

    for (const claim of claims) {
        const diasRestantes = Math.max(0, Math.ceil((new Date(claim.expires_at) - Date.now()) / (24 * 60 * 60 * 1000)));
        const { error: notifError } = await supabaseAdmin.from('notifications').insert({
            profile_id: claim.client_id,
            type: 'promotion',
            title: '⏳ Tu cupón está por vencer',
            body: `${claim.coupons?.description || claim.coupons?.code || 'Tu cupón'} vence en ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}. ¡No lo dejes pasar!`,
            action_url: '/mis-citas',
        });
        if (notifError) {
            console.error('No se pudo enviar el recordatorio del cupón:', notifError.message);
            continue;
        }
        await supabaseAdmin.from('coupon_claims').update({ reminder_sent_at: new Date().toISOString() }).eq('id', claim.id);
    }
}
