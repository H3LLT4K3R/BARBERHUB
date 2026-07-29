import { supabaseAdmin } from '../config/supabase.js';

// Requiere que requireUser ya haya corrido antes (necesita req.user).
export async function requireSuperAdmin(req, res, next) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('is_super_admin')
        .eq('id', req.user.id)
        .maybeSingle();

    if (error || !data?.is_super_admin) {
        return res.status(403).json({ error: 'Solo un super administrador puede hacer esto.' });
    }

    next();
}
