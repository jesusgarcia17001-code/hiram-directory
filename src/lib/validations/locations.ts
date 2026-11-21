import { z } from "zod";

export const LOCATION_SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const stateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre del estado debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  slug: z
    .string()
    .trim()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(80, "El slug no puede exceder 80 caracteres")
    .regex(
      LOCATION_SLUG_REGEX,
      "El slug solo puede contener letras minúsculas, números y guiones"
    ),
  is_active: z.coerce.boolean().default(true),
});

export const municipalitySchema = z.object({
  state_id: z.string().uuid("Debes seleccionar un estado válido"),
  name: z
    .string()
    .trim()
    .min(2, "El nombre del municipio debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  slug: z
    .string()
    .trim()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(80, "El slug no puede exceder 80 caracteres")
    .regex(
      LOCATION_SLUG_REGEX,
      "El slug solo puede contener letras minúsculas, números y guiones"
    ),
  is_active: z.coerce.boolean().default(true),
});

export const localitySchema = z.object({
  municipality_id: z.string().uuid("Debes seleccionar un municipio válido"),
  name: z
    .string()
    .trim()
    .min(2, "El nombre de la localidad debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  slug: z
    .string()
    .trim()
    .min(2, "El slug debe tener al menos 2 caracteres")
    .max(80, "El slug no puede exceder 80 caracteres")
    .regex(
      LOCATION_SLUG_REGEX,
      "El slug solo puede contener letras minúsculas, números y guiones"
    ),
  is_active: z.coerce.boolean().default(true),
});
