import { z } from "zod";

export const CATEGORY_SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  listing_slug: z
    .string()
    .trim()
    .min(2, "El slug de URL debe tener al menos 2 caracteres")
    .max(80, "El slug no puede exceder 80 caracteres")
    .regex(
      CATEGORY_SLUG_REGEX,
      "El slug de URL solo puede contener letras minúsculas, números y guiones (ej. cerrajeros, tecnicos-gas)"
    ),
  singular_label: z
    .string()
    .trim()
    .min(2, "El título singular debe tener al menos 2 caracteres")
    .max(80, "El título singular no puede exceder 80 caracteres"),
  plural_label: z
    .string()
    .trim()
    .min(2, "El título plural debe tener al menos 2 caracteres")
    .max(80, "El título plural no puede exceder 80 caracteres"),
  description: z
    .string()
    .trim()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  seo_intro: z
    .string()
    .trim()
    .max(1000, "El texto SEO no puede exceder 1000 caracteres")
    .optional()
    .or(z.literal("")),
  icon: z
    .string()
    .trim()
    .max(50, "El identificador de icono no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  sort_order: z.coerce
    .number()
    .int("El orden debe ser un número entero")
    .default(0),
  is_active: z.coerce.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
