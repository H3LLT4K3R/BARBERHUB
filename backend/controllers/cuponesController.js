import { supabaseAdmin } from '../config/supabase.js';
import { validarCupon } from '../utils/cupones.js';

function round2(value) {
    return Math.round(value * 100) / 100;
}

// Valida un cupón SIN crear la cita, para reflejar el descuento en el resumen de
// reserva antes de que el cliente confirme. Reusa exactamente las mismas reglas
// que crearCita, así nunca se puede desincronizar lo que se muestra de lo que se cobra.
export const validarCuponPreview = async (req, res) => {
    const { couponCode, barberiaId, serviceIds, barberMembershipId, scheduledAt } = req.body;

    if (!couponCode || !barberiaId || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        return res.status(400).json({ error: 'Faltan couponCode, barberiaId o serviceIds.' });
    }

    try {
        const uniqueServiceIds = [...new Set(serviceIds)];
        const { data: services, error: servicesError } = await supabaseAdmin
            .from('services')
            .select('id, price')
            .eq('barberia_id', barberiaId)
            .eq('is_active', true)
            .in('id', uniqueServiceIds);
        if (servicesError) throw servicesError;
        if (!services || services.length !== uniqueServiceIds.length) {
            return res.status(400).json({ error: 'Uno o más servicios no son válidos.' });
        }

        let staffOverrides = new Map();
        if (barberMembershipId) {
            const { data: overrides, error: overridesError } = await supabaseAdmin
                .from('staff_services')
                .select('service_id, custom_price')
                .eq('membership_id', barberMembershipId)
                .eq('is_active', true)
                .in('service_id', uniqueServiceIds);
            if (overridesError) throw overridesError;
            staffOverrides = new Map((overrides ?? []).map((o) => [o.service_id, o]));
        }

        const quantities = serviceIds.reduce((map, id) => map.set(id, (map.get(id) ?? 0) + 1), new Map());
        const subtotal = round2(
            services.reduce((sum, service) => {
                const override = staffOverrides.get(service.id);
                const unitPrice = Number(override?.custom_price ?? service.price);
                return sum + unitPrice * quantities.get(service.id);
            }, 0)
        );

        const { coupon, discountTotal } = await validarCupon({
            couponCode,
            barberiaId,
            clientId: req.user.id,
            subtotal,
            serviceIds: uniqueServiceIds,
            barberMembershipId: barberMembershipId || null,
            scheduledAt: scheduledAt || null,
        });

        res.json({
            valido: true,
            codigo: coupon.code,
            descripcion: coupon.description,
            subtotal,
            descuento: discountTotal,
            total: round2(subtotal - discountTotal),
        });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ error: error.message });
        console.error('Error al validar cupón:', error);
        res.status(500).json({ error: 'No fue posible validar el cupón.' });
    }
};
