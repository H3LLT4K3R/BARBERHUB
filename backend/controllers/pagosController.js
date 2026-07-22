import transporter from '../config/mail.js';
import { supabaseAdmin } from '../config/supabase.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const MODERADOR_EMAIL = process.env.MAIL_USER;

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

async function esOwnerOAdmin(userId, barberiaId) {
    const { data, error } = await supabaseAdmin
        .from('barberia_memberships')
        .select('id')
        .eq('barberia_id', barberiaId)
        .eq('profile_id', userId)
        .in('role', ['owner', 'admin'])
        .eq('is_active', true)
        .maybeSingle();
    if (error) throw error;
    return data;
}

// El dueño envía su link de Mercado Pago a revisión manual antes de poder cobrar en la plataforma.
export const solicitarLink = async (req, res) => {
    const { barberiaId, link } = req.body;
    if (!barberiaId || !link) {
        return res.status(400).json({ error: 'Faltan barberiaId o link.' });
    }

    try {
        const membership = await esOwner(req.user.id, barberiaId);
        if (!membership) {
            return res.status(403).json({ error: 'Solo el dueño de la barbería puede solicitar esto.' });
        }

        const { data: barberia } = await supabaseAdmin
            .from('barberias')
            .select('name')
            .eq('id', barberiaId)
            .maybeSingle();

        const { data: solicitud, error: upsertError } = await supabaseAdmin
            .from('payment_provider_accounts')
            .upsert(
                {
                    barberia_id: barberiaId,
                    provider: 'mercado_pago',
                    payment_link: link,
                    status: 'pending_review',
                    requested_by: req.user.id,
                    reviewed_by: null,
                    reviewed_at: null,
                    rejection_reason: null,
                },
                { onConflict: 'barberia_id,provider' }
            )
            .select('id')
            .single();
        if (upsertError) throw upsertError;

        const nombreBarberia = barberia?.name ?? barberiaId;
        try {
            await transporter.sendMail({
                from: '"Sistema BarberHub" <bartfestmixology@gmail.com>',
                to: MODERADOR_EMAIL,
                subject: `🚨 Nueva solicitud de Link: ${nombreBarberia}`,
                html: `
                    <h2>Se ha enviado un nuevo link para revisión</h2>
                    <p><strong>Barbería:</strong> ${nombreBarberia}</p>
                    <p><strong>Link a revisar:</strong> <a href="${link}">${link}</a></p>
                    <br>
                    <p>Haz clic en el siguiente enlace para aprobarlo y habilitarlo en la plataforma:</p>
                    <a href="${BACKEND_URL}/api/aprobar/${solicitud.id}"
                       style="padding: 20px 20px; background-color: #ffcb5c; color: black; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                       ✅ APROBAR LINK DE LA BARBERIA: ${nombreBarberia}
                    </a>
                `,
            });
        } catch (mailError) {
            // La solicitud ya quedó guardada en la base; el correo es solo el aviso.
            console.error('Error al enviar el correo de solicitud:', mailError);
        }

        res.json({ mensaje: 'Enviado a revisión exitosamente.', id: solicitud.id });
    } catch (error) {
        console.error('Error al solicitar el link de pago:', error);
        res.status(500).json({ error: 'No fue posible enviar la solicitud.' });
    }
};

// El moderador (tú) aprueba haciendo clic en el link del correo. No requiere sesión de
// la app (es un flujo por correo), igual que en el diseño original.
export const aprobarLink = async (req, res) => {
    try {
        const { data: solicitud, error: fetchError } = await supabaseAdmin
            .from('payment_provider_accounts')
            .select('id, payment_link, requested_by')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!solicitud) {
            return res.status(404).send("<h1 style='color: red; text-align: center;'>❌ Solicitud no encontrada</h1>");
        }

        const { error: updateError } = await supabaseAdmin
            .from('payment_provider_accounts')
            .update({ status: 'approved', reviewed_at: new Date().toISOString() })
            .eq('id', solicitud.id);
        if (updateError) throw updateError;

        if (solicitud.requested_by) {
            await supabaseAdmin.from('notifications').insert({
                profile_id: solicitud.requested_by,
                type: 'system',
                title: '¡Tu link de pago fue aprobado!',
                body: 'Ya puedes empezar a recibir pagos en la plataforma con el enlace que enviaste.',
                action_url: '/owner-control',
                data: { paymentProviderAccountId: solicitud.id },
            });
        }

        res.send("<h1 style='color: green; text-align: center; margin-top: 50px;'>✅ Link Aprobado y Barbero Notificado.</h1>");
    } catch (error) {
        console.error('Error al aprobar el link:', error);
        res.send("<h1>Ocurrió un error al aprobar el link.</h1>");
    }
};

// El dueño/admin consulta el estado de su solicitud.
export const estadoLink = async (req, res) => {
    const { barberiaId } = req.params;

    try {
        const membership = await esOwnerOAdmin(req.user.id, barberiaId);
        if (!membership) return res.status(403).json({ error: 'No tienes permiso sobre esta barbería.' });

        const { data: solicitud, error } = await supabaseAdmin
            .from('payment_provider_accounts')
            .select('status, payment_link')
            .eq('barberia_id', barberiaId)
            .eq('provider', 'mercado_pago')
            .maybeSingle();
        if (error) throw error;

        res.json(solicitud ? { estado: solicitud.status, link: solicitud.payment_link } : { estado: 'sin_registro' });
    } catch (error) {
        console.error('Error al consultar el estado del link:', error);
        res.status(500).json({ error: 'No fue posible consultar el estado.' });
    }
};
