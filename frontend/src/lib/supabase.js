import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_KEY. Configúralas en frontend/.env.local."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
