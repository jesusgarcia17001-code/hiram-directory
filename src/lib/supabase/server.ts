import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { sanitizeSupabaseUrl } from "./utils";

/**
 * Cliente de Supabase para el Servidor (Server Components, Server Actions, Route Handlers).
 * Respeta el contexto de autenticación y las políticas RLS del usuario conectado.
 * Marcado con "server-only" para evitar su inclusión accidental en el cliente.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/^["']|["']$/g, "");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // El método `setAll` puede ser llamado desde un Server Component donde
          // no se pueden modificar cookies directamente. Esto se gestiona en middleware.ts.
        }
      },
    },
  });
}
