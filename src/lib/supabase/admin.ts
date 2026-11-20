import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { sanitizeSupabaseUrl } from "./utils";

/**
 * Cliente privilegiado de Supabase con Service Role.
 * REGLAS DE SEGURIDAD (CLAUDE.md):
 * 1. Protegido estrictamente con "server-only".
 * 2. Jamás se expone al navegador ni en variables NEXT_PUBLIC_*.
 * 3. Solo para operaciones administrativas verificadas en el servidor (Fases 3 y 5).
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^["']|["']$/g, "");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para el cliente admin."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
