import { z } from "zod";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_SERVICES_PER_PROFESSIONAL = 15;

export const photoCaptionSchema = z
  .string()
  .trim()
  .max(200, "El pie de foto no puede exceder 200 caracteres")
  .optional()
  .nullable();

export const professionalServiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre del servicio debe tener al menos 2 caracteres")
    .max(120, "El nombre del servicio no puede exceder 120 caracteres"),
  description: z
    .string()
    .trim()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional()
    .nullable(),
});
