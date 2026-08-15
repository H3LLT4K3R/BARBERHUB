import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { clearSession } from "../utils/api.js";

// Cierra la sesión y redirige al login si, después de haber iniciado sesión:
// - la barbería del usuario (owner/admin/barbero) fue suspendida por el super
//   admin (p. ej. por falta de pago), o
// - su propia membresía de staff fue desactivada (p. ej. el barbero se dio de
//   baja él mismo, o el owner lo desactivó) — sin esto, una sesión ya abierta
//   en un panel de barbero/owner seguiría funcionando hasta que expirara sola.
export function useSuspensionGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return;

      const { data: memberships } = await supabase
        .from("barberia_memberships")
        .select("is_active, barberias(name, is_suspended)")
        .eq("profile_id", uid);

      if (cancelado || !memberships?.length) return;

      const activa = memberships.find((m) => m.is_active);

      if (!activa) {
        await clearSession();
        await supabase.auth.signOut();
        navigate("/login", {
          replace: true,
          state: { error: "Ya no tienes acceso a este panel. Contacta al dueño de la barbería si crees que se trata de un error." },
        });
        return;
      }

      if (!activa.barberias?.is_suspended) return;

      await clearSession();
      await supabase.auth.signOut();
      navigate("/login", {
        replace: true,
        state: {
          error: `La barbería "${activa.barberias.name}" está temporalmente suspendida por falta de pago. Contacta a soporte para reactivarla.`,
        },
      });
    }

    verificar();
    return () => { cancelado = true; };
  }, [navigate]);
}
