import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import { clearSession } from "../utils/api.js";

// Cierra la sesión y redirige al login si la cuenta del cliente fue eliminada
// (profiles.is_active = false) mientras la sesión seguía activa en el navegador.
// El checkeo de login.jsx solo corre al enviar el formulario; una sesión ya
// guardada en localStorage se restaura sola sin volver a pasar por ahí.
export function useActiveAccountGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", uid)
        .maybeSingle();

      if (cancelado || !profile || profile.is_active !== false) return;

      await clearSession();
      await supabase.auth.signOut();
      navigate("/login", {
        replace: true,
        state: { error: "Esta cuenta fue eliminada. Contacta a soporte si crees que se trata de un error." },
      });
    }

    verificar();
    return () => { cancelado = true; };
  }, [navigate]);
}
