import { supabaseAdmin } from '../config/supabase.js';

// Verifica el token de sesión de Supabase que manda el frontend y adjunta el usuario a la request.
export async function requireUser(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Falta el token de sesión.' });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
        return res.status(401).json({ error: 'Sesión inválida o expirada.' });
    }

    req.user = data.user;
    next();
}
