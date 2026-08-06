import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { clearSession } from "../utils/api.js";

// Cierra la sesión y redirige al login si la barbería del usuario (owner/admin/barbero)
// fue suspendida por el super admin (p. ej. por falta de pago) después de haber iniciado sesión.
export function useSuspensionGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return;

      const { data: membership } = await supabase
        .from("barberia_memberships")
        .select("barberias(name, is_suspended)")
        .eq("profile_id", uid)
        .eq("is_active", true)
        .maybeSingle();

      if (cancelado || !membership?.barberias?.is_suspended) return;

      await clearSession();
      await supabase.auth.signOut();
      navigate("/login", {
        replace: true,
        state: {
          error: `La barbería "${membership.barberias.name}" está temporalmente suspendida por falta de pago. Contacta a soporte para reactivarla.`,
        },
      });
    }

    verificar();
    return () => { cancelado = true; };
  }, [navigate]);
}
