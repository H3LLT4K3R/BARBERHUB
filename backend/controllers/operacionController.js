import { supabaseAdmin } from '../config/supabase.js';

// El dueño desde Seguridad de la Plataforma puede apagarle a un admin el acceso a un
// módulo (ver DB/add_module_permissions_enforcement.sql); esto lo hace valer también
// en el backend. El dueño nunca se restringe a sí mismo, y si a alguien aún no se le
// configuró ningún permiso tiene acceso completo.
async function tieneAccesoModulo(userId, barberiaId, moduleCode) {
    const { data, error } = await supabaseAdmin.rpc('has_module_access', {
        p_barberia_id: barberiaId,
        p_module_code: moduleCode,
        p_need_manage: true,
        p_profile_id: userId,
    });
    if (error) throw error;
    return data === true;
}

const TIPOS_MOVIMIENTO = ['purchase', 'adjustment_in', 'adjustment_out', 'consumption', 'waste', 'return'];
const TIPOS_TRANSACCION = ['income', 'expense', 'refund', 'adjustment'];

// Confirma que el usuario autenticado es owner/admin activo de la barbería
// (el rol "barber" no debería ver ni tocar finanzas/inventario).
async function esOwnerOAdmin(userId, barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('id, role')
        .eq('barberia_id', barberiaId)
        .eq('profile_id', userId)
        .in('role', ['owner', 'admin'])
        .eq('is_active', true)
        .maybeSingle();
    if (error) throw error;
    return data;
}

// -------------------- INVENTARIO --------------------
export const registrarMovimientoInventario = async (req, res) => {
    const { inventoryItemId, type, quantity, unitCost, reason } = req.body;

    if (!inventoryItemId || !type || !quantity) {
        return res.status(400).json({ error: 'Faltan inventoryItemId, type o quantity.' });
    }
    if (!TIPOS_MOVIMIENTO.includes(type)) {
        return res.status(400).json({ error: `type debe ser uno de: ${TIPOS_MOVIMIENTO.join(', ')}` });
    }
    if (Number(quantity) === 0) {
        return res.status(400).json({ error: 'La cantidad no puede ser cero.' });
    }

    try {
        const { data: item, error: itemError } = await supabaseAdmin
            .from('inventory_items')
            .select('id, barberia_id, name, stock_on_hand')
            .eq('id', inventoryItemId)
            .maybeSingle();
        if (itemError) throw itemError;
        if (!item) return res.status(404).json({ error: 'Producto no encontrado.' });

        const membership = await esOwnerOAdmin(req.user.id, item.barberia_id);
        if (!membership) return res.status(403).json({ error: 'No tienes permiso sobre el inventario de esta barbería.' });
        if (!(await tieneAccesoModulo(req.user.id, item.barberia_id, 'inventario'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Inventario.' });
        }

        // Las salidas (consumo, merma, ajuste negativo) se guardan como cantidad negativa;
        // el trigger de la base de datos suma esto directo al stock, así que el signo importa.
        const salida = ['adjustment_out', 'consumption', 'waste'].includes(type);
        const cantidadFirmada = salida ? -Math.abs(Number(quantity)) : Math.abs(Number(quantity));

        const { data: movimiento, error: insertError } = await supabaseAdmin
            .from('inventory_movements')
            .insert({
                inventory_item_id: inventoryItemId,
                type,
                quantity: cantidadFirmada,
                unit_cost: unitCost ?? null,
                reason: reason || null,
                performed_by: req.user.id,
            })
            .select('id, quantity, type, created_at')
            .single();

        if (insertError) {
            // El check stock_on_hand >= 0 de la tabla rechaza movimientos que dejarían stock negativo.
            if (insertError.code === '23514') {
                return res.status(409).json({ error: `No hay suficiente stock de "${item.name}" para este movimiento.` });
            }
            throw insertError;
        }

        const { data: itemActualizado } = await supabaseAdmin
            .from('inventory_items')
            .select('stock_on_hand')
            .eq('id', inventoryItemId)
            .maybeSingle();

        res.status(201).json({ movimiento, stockActual: itemActualizado?.stock_on_hand });
    } catch (error) {
        console.error('Error al registrar movimiento de inventario:', error);
        res.status(500).json({ error: 'No fue posible registrar el movimiento.' });
    }
};

// -------------------- FINANZAS --------------------
export const registrarTransaccionFinanciera = async (req, res) => {
    const { barberiaId, type, category, amount, description, occurredAt } = req.body;

    if (!barberiaId || !type || !category || !amount) {
        return res.status(400).json({ error: 'Faltan barberiaId, type, category o amount.' });
    }
    if (!TIPOS_TRANSACCION.includes(type)) {
        return res.status(400).json({ error: `type debe ser uno de: ${TIPOS_TRANSACCION.join(', ')}` });
    }
    if (Number(amount) <= 0) {
        return res.status(400).json({ error: 'amount debe ser mayor a cero.' });
    }

    try {
        const membership = await esOwnerOAdmin(req.user.id, barberiaId);
        if (!membership) return res.status(403).json({ error: 'No tienes permiso sobre las finanzas de esta barbería.' });
        if (!(await tieneAccesoModulo(req.user.id, barberiaId, 'finanzas'))) {
            return res.status(403).json({ error: 'No tienes acceso al módulo de Finanzas.' });
        }

        const { data: transaccion, error: insertError } = await supabaseAdmin
            .from('financial_transactions')
            .insert({
                barberia_id: barberiaId,
                type,
                category,
                amount,
                description: description || null,
                occurred_at: occurredAt || new Date().toISOString(),
                created_by: req.user.id,
            })
            .select('id, type, category, amount, occurred_at')
            .single();
        if (insertError) throw insertError;

        res.status(201).json({ transaccion });
    } catch (error) {
        console.error('Error al registrar transacción financiera:', error);
        res.status(500).json({ error: 'No fue posible registrar la transacción.' });
    }
};

// Se llama internamente (no es una ruta HTTP) cuando un pago de Mercado Pago se aprueba,
// para que el ingreso aparezca automáticamente en las finanzas de la barbería.
export async function registrarIngresoPorPago({ barberiaId, paymentId, amount, appointmentId }) {
    const { error } = await supabaseAdmin.from('financial_transactions').insert({
        barberia_id: barberiaId,
        payment_id: paymentId,
        type: 'income',
        category: 'anticipo_cita',
        amount,
        description: `Anticipo de cita ${appointmentId}`,
    });
    if (error) console.error('No se pudo registrar el ingreso automático:', error.message);
}
