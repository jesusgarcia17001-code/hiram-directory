import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { sanitizeSupabaseUrl } from "./utils";

/**
 * Cliente de Supabase para componentes del navegador (Client Components).
 * Utiliza únicamente las variables públicas NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, "");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
