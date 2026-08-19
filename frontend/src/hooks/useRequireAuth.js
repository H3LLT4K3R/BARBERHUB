import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

// A diferencia de useActiveAccountGuard (que solo cierra la sesión si la cuenta
// fue eliminada, y se usa también en pantallas públicas que un visitante sin
// sesión puede navegar libremente, como el perfil de una barbería), este hook
// es para pantallas que YA asumen un usuario logueado — hoy, si alguien entraba
// por URL directa sin sesión, simplemente se quedaban en blanco o con datos
// vacíos en vez de mandarlo a iniciar sesión.
export function useRequireAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelado = false;

    async function verificar() {
      const { data } = await supabase.auth.getUser();
      if (cancelado) return;
      if (!data.user) {
        navigate("/login", { replace: true, state: { redirigirA: location.pathname } });
      }
    }

    verificar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);
}
