import { supabaseAdmin } from '../config/supabase.js';
import transporter from '../config/mail.js';

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');
const MAIL_FROM = process.env.MAIL_FROM || `"Barber Hub" <${process.env.MAIL_USER}>`;

const getFrontendUrl = (req) => {
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
    if (origin && !origin.includes('localhost')) {
        return origin.replace(/\/+$/, '');
    }
    if (FRONTEND_URL && !FRONTEND_URL.includes('localhost')) {
        return FRONTEND_URL;
    }
    return origin || FRONTEND_URL || 'http://localhost:5173';
};

// Envía un correo de recuperación con la marca de Barber Hub, usando un link de
// recuperación real generado por Supabase (no el correo genérico de Supabase).
// Responde éxito siempre exista o no la cuenta, para no filtrar qué correos están registrados.
export const solicitarRecuperacion = async (req, res) => {
    const { email } = req.body;
    if (!email?.trim()) {
        return res.status(400).json({ error: 'Falta el correo electrónico.' });
    }

    try {
        const frontendUrl = getFrontendUrl(req);
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email.trim(),
            options: { redirectTo: `${frontendUrl}/restablecer-password` },
        });

        if (error) {
            // Usuario no encontrado u otro error: no lo revelamos al cliente.
            console.error('No se pudo generar el link de recuperación:', error.message);
            return res.json({ ok: true });
        }

        res.json({ ok: true });

        transporter.sendMail({
            from: MAIL_FROM,
            to: email.trim(),
            subject: 'Recupera tu contraseña de Barber Hub',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #111;">Barber Hub</h2>
                    <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                    <p>Haz clic en el siguiente botón para elegir una nueva contraseña. Si tú no solicitaste esto, puedes ignorar este correo.</p>
                    <a href="${data.properties.action_link}"
                       style="display: inline-block; padding: 14px 24px; background-color: #c9a227; color: #111; text-decoration: none; font-weight: bold; border-radius: 8px; margin-top: 12px;">
                       Restablecer contraseña
                    </a>
                    <p style="color: #888; font-size: 13px; margin-top: 24px;">Este enlace expira en 1 hora.</p>
                </div>
            `,
        }).catch((mailError) => {
            console.error('Error al enviar el correo de recuperación:', mailError);
        });
    } catch (error) {
        console.error('Error al procesar la recuperación de contraseña:', error);
        res.status(500).json({ error: 'No fue posible procesar la solicitud.' });
    }
};

// Crea la cuenta del cliente y envía el correo de confirmación con la marca de Barber Hub,
// en vez de dejar que Supabase mande su propio correo genérico ("Supabase Auth").
export const registrarUsuario = async (req, res) => {
    const { fullName, email, phone, password } = req.body;

    if (!fullName?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ error: 'Faltan fullName, email o password.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName.trim() },
        });

        if (error) {
            if (error.message?.includes('already registered') || error.code === 'email_exists' || error.status === 422) {
                return res.status(409).json({ error: 'Este correo ya tiene una cuenta. Intenta iniciar sesión.' });
            }
            return res.status(400).json({ error: error.message || 'No fue posible crear la cuenta.' });
        }

        if (phone?.trim() && data?.user?.id) {
            await supabaseAdmin.from('profiles').update({ phone: phone.trim() }).eq('id', data.user.id);
        }

        res.status(201).json({ ok: true, user: { id: data.user.id, email: data.user.email } });

        transporter.sendMail({
            from: MAIL_FROM,
            to: email.trim(),
            subject: '¡Bienvenido a Barber Hub!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #111;">Barber Hub</h2>
                    <p>Hola <strong>${fullName.trim()}</strong>,</p>
                    <p>¡Tu cuenta se ha creado con éxito! Ya puedes iniciar sesión en Barber Hub.</p>
                </div>
            `,
        }).catch((mailError) => {
            console.error('Error enviando correo de bienvenida:', mailError.message);
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: error.message || 'No fue posible crear la cuenta.' });
    }
};
