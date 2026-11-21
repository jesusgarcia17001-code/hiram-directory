/**
 * Construye la URL pública para cualquier archivo alojado en el bucket 'professional-media'.
 * Seguro para importar tanto en componentes del servidor como del cliente.
 */
export function getPublicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) return null;

  return `${supabaseUrl}/storage/v1/object/public/professional-media/${path}`;
}
