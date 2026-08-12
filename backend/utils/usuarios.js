import { supabaseAdmin } from '../config/supabase.js';

// Devuelve un Map<profileId, email> solo para los IDs pedidos. A diferencia de
// listUsers(), que trae como máximo una página de usuarios del proyecto entero y
// deja el resto sin email en silencio, esto siempre resuelve exactamente los IDs
// que se piden, sin importar cuántos usuarios totales tenga el proyecto.
export async function obtenerEmailsPorId(profileIds) {
    const idsUnicos = [...new Set(profileIds.filter(Boolean))];

    const resultados = await Promise.all(
        idsUnicos.map((id) => supabaseAdmin.auth.admin.getUserById(id))
    );

    return new Map(
        resultados.map(({ data }, i) => [idsUnicos[i], data?.user?.email ?? null])
    );
}
