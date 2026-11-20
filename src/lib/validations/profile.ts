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
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

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
});

export type ProfileInput = z.infer<typeof profileSchema>;
