import { z } from "zod";

/**
 * Regex para validar formato telefónico internacional E.164 venezolano (+58 seguido de 10 dígitos).
 * Ejemplo: +584141234567, +584241234567, +584121234567, +582811234567.
 */
export const VENEZUELA_PHONE_REGEX = /^\+58[1-9][0-9]{9}$/;

/**
 * Normaliza cualquier entrada de teléfono común en Venezuela a formato estricto E.164 (+58...).
 * Ejemplos aceptados:
 * - "0414-1234567" -> "+584141234567"
 * - "04141234567"  -> "+584141234567"
 * - "4141234567"   -> "+584141234567"
 * - "+584141234567" -> "+584141234567"
 */
export function normalizePhoneToE164(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  if (cleaned.startsWith("+58")) {
    return cleaned;
  }
  if (cleaned.startsWith("58") && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return `+58${cleaned.slice(1)}`;
  }
  if (cleaned.length === 10) {
    return `+58${cleaned}`;
  }
  return cleaned;
}

/**
 * Normaliza un handle de red social (Instagram, TikTok).
 * Elimina espacios, arroba inicial (@), y si el usuario pegó la URL completa,
 * extrae limpiamente el nombre de usuario.
 * Ejemplos:
 * - "@carlos_plomero" -> "carlos_plomero"
 * - "  pedro.tecnico " -> "pedro.tecnico"
 * - "https://www.instagram.com/juan_frio/" -> "juan_frio"
 * - "https://tiktok.com/@maria.clima" -> "maria.clima"
 */
export function normalizeSocialHandle(handle: string): string {
  if (!handle) return "";
  let cleaned = handle.trim();
  // Quitar URL si la pegaron completa
  cleaned = cleaned.replace(/^https?:\/\/(?:www\.)?(?:instagram\.com|tiktok\.com)\/@?/i, "");
  // Quitar barras finales o parámetros
  cleaned = cleaned.replace(/\/.*$/, "").replace(/\?.*$/, "");
  // Quitar @ iniciales y espacios
  cleaned = cleaned.replace(/^@+/, "").trim();
  return cleaned;
}

export const SOCIAL_HANDLE_REGEX = /^[a-zA-Z0-9._]{1,30}$/;

/**
 * Validador estricto de URL HTTPS para Facebook y sitios web.
 * Rechaza terminantemente esquemas peligrosos como javascript:, data:, vbscript:, http:, etc.
 */
export function isValidHttpsUrl(url: string): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return false;
  }
  if (!lower.startsWith("https://")) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Genera un slug válido para URL a partir del nombre comercial.
 * Ejemplo: "Plomería & Gas Los Andes" -> "plomeria-gas-los-andes"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/[^a-z0-9]+/g, "-") // Sustituir caracteres no alfanuméricos por guion
    .replace(/^-+|-+$/g, "") // Eliminar guiones iniciales o finales
    .slice(0, 80);
}

/**
 * Esquema de validación para el perfil del profesional (técnico o empresa).
 */
export const profileSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(2, "El nombre comercial o razón social debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede superar los 120 caracteres."),
  provider_type: z.enum(["individual", "company"], {
    error: "Selecciona si eres técnico independiente o empresa/taller.",
  }),
  id_type: z.enum(["V", "E", "J", "G"], {
    error: "Selecciona el tipo de documento (V, E para personas; J, G para empresas).",
  }),
  id_number: z
    .string()
    .trim()
    .regex(/^[0-9]{5,10}$/, "El número de documento debe tener entre 5 y 10 dígitos numéricos."),
  locality_id: z
    .string()
    .uuid("Selecciona una localidad válida de Anzoátegui."),
  category_id: z
    .string()
    .uuid("Selecciona una categoría de servicio principal."),
  description: z
    .string()
    .trim()
    .max(3000, "La descripción no puede superar los 3000 caracteres.")
    .optional()
    .or(z.literal("")),
  experience_years: z
    .coerce
    .number({ error: "Ingresa los años de experiencia." })
    .int("Debe ser un número entero.")
    .min(0, "Los años de experiencia no pueden ser negativos.")
    .max(80, "Los años de experiencia no pueden superar 80 años."),
  whatsapp_phone: z
    .string()
    .trim()
    .transform((val) => normalizePhoneToE164(val))
    .refine(
      (val) => VENEZUELA_PHONE_REGEX.test(val),
      "Ingresa un número de WhatsApp venezolano válido (ej: 0414-1234567 o +584141234567)."
    ),
  phone: z
    .string()
    .trim()
    .transform((val) => normalizePhoneToE164(val))
    .refine(
      (val) => val === "" || VENEZUELA_PHONE_REGEX.test(val),
      "Ingresa un número de llamada válido en formato +58 o vacío."
    )
    .optional()
    .or(z.literal("")),
  service_areas: z
    .array(z.string())
    .max(20, "Máximo 20 zonas de servicio.")
    .default([]),
  contact_person_name: z
    .string()
    .trim()
    .max(80, "El nombre de contacto no puede superar los 80 caracteres.")
    .refine(
      (val) => val === "" || val.length >= 2,
      "El nombre de la persona debe tener al menos 2 caracteres."
    )
    .optional()
    .or(z.literal("")),
  instagram_handle: z
    .string()
    .trim()
    .transform((val) => normalizeSocialHandle(val))
    .refine(
      (val) => val === "" || SOCIAL_HANDLE_REGEX.test(val),
      "El usuario de Instagram solo puede tener letras, números, punto o guion bajo (máx. 30 caracteres)."
    )
    .optional()
    .or(z.literal("")),
  tiktok_handle: z
    .string()
    .trim()
    .transform((val) => normalizeSocialHandle(val))
    .refine(
      (val) => val === "" || SOCIAL_HANDLE_REGEX.test(val),
      "El usuario de TikTok solo puede tener letras, números, punto o guion bajo (máx. 30 caracteres)."
    )
    .optional()
    .or(z.literal("")),
  facebook_url: z
    .string()
    .trim()
    .max(200, "La dirección de Facebook no puede superar los 200 caracteres.")
    .refine(
      (val) => val === "" || isValidHttpsUrl(val),
      "La dirección de Facebook debe comenzar con https:// y ser una URL válida."
    )
    .optional()
    .or(z.literal("")),
  website_url: z
    .string()
    .trim()
    .max(200, "La dirección web no puede superar los 200 caracteres.")
    .refine(
      (val) => val === "" || isValidHttpsUrl(val),
      "El sitio web debe comenzar con https:// y ser una URL segura."
    )
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
