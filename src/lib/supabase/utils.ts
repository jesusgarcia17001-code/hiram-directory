/**
 * Normaliza y sanea la URL de Supabase para evitar errores de Kong API Gateway
 * como "Invalid path specified in request URL" causado por barras finales accidentales
 * (ej: "https://xyz.supabase.co/") o rutas pegadas por error (ej: "/rest/v1").
 */
export function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  // Eliminar comillas iniciales o finales si fueron pegadas
  url = url.replace(/^["']|["']$/g, "");
  // Eliminar barras diagonales al final
  url = url.replace(/\/+$/, "");
  // Eliminar subrutas accidentales si se copiaron de la documentación
  url = url.replace(/\/(rest|auth)\/v1\/?$/, "");
  return url;
}
