import { describe, it, expect } from "vitest";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_SERVICES_PER_PROFESSIONAL,
  photoCaptionSchema,
  professionalServiceSchema,
} from "@/lib/validations/media";
import { getPublicMediaUrl } from "@/lib/storage-public";

describe("Fase 7, Paso 3: Validaciones y Reglas de Fotos y Servicios", () => {
  it("debe validar tipos MIME permitidos (solo JPG, PNG y WebP)", () => {
    expect(ALLOWED_IMAGE_MIME_TYPES.includes("image/jpeg")).toBe(true);
    expect(ALLOWED_IMAGE_MIME_TYPES.includes("image/png")).toBe(true);
    expect(ALLOWED_IMAGE_MIME_TYPES.includes("image/webp")).toBe(true);

    // No permitidos
    expect(ALLOWED_IMAGE_MIME_TYPES.includes("image/gif")).toBe(false);
    expect(ALLOWED_IMAGE_MIME_TYPES.includes("image/svg+xml")).toBe(false);
    expect(ALLOWED_IMAGE_MIME_TYPES.includes("application/pdf")).toBe(false);
  });

  it("debe validar el límite de tamaño de archivo (máximo 5 MB)", () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);

    const isFileSizeValid = (sizeBytes: number) => sizeBytes <= MAX_FILE_SIZE_BYTES;
    expect(isFileSizeValid(1024 * 1024)).toBe(true); // 1 MB
    expect(isFileSizeValid(5 * 1024 * 1024)).toBe(true); // 5 MB exactos
    expect(isFileSizeValid(5 * 1024 * 1024 + 1)).toBe(false); // 5 MB + 1 byte
  });

  it("debe validar el pie de foto (máximo 200 caracteres)", () => {
    const validCaption = "Instalación de aire split 18000 BTU en Lechería";
    expect(photoCaptionSchema.safeParse(validCaption).success).toBe(true);
    expect(photoCaptionSchema.safeParse("").success).toBe(true);
    expect(photoCaptionSchema.safeParse(null).success).toBe(true);

    // Más de 200 caracteres
    const longCaption = "A".repeat(201);
    expect(photoCaptionSchema.safeParse(longCaption).success).toBe(false);
  });

  it("debe validar el nombre del servicio (entre 2 y 120 caracteres)", () => {
    const validService = { name: "Mantenimiento preventivo de split" };
    expect(professionalServiceSchema.safeParse(validService).success).toBe(true);

    // Demasiado corto (1 caracter)
    expect(professionalServiceSchema.safeParse({ name: "A" }).success).toBe(false);

    // Vacío
    expect(professionalServiceSchema.safeParse({ name: "" }).success).toBe(false);

    // Demasiado largo (121 caracteres)
    const longName = "A".repeat(121);
    expect(professionalServiceSchema.safeParse({ name: longName }).success).toBe(false);
  });

  it("regla de negocio: el límite de fotos se obtiene dinámicamente del plan", () => {
    // Simula la lectura dinámica de plans.features.max_photos
    const resolveMaxPhotos = (
      activeSubscription: { planFeatures: { max_photos: number } } | null,
      freePlanFeatures: { max_photos: number }
    ) => {
      if (activeSubscription) {
        return Number(activeSubscription.planFeatures.max_photos);
      }
      return Number(freePlanFeatures.max_photos);
    };

    // Caso 1: Profesional sin suscripción activa (usa plan Gratuito)
    const freeResult = resolveMaxPhotos(null, { max_photos: 3 });
    expect(freeResult).toBe(3);

    // Caso 2: Profesional con plan Profesional activo
    const proResult = resolveMaxPhotos({ planFeatures: { max_photos: 6 } }, { max_photos: 3 });
    expect(proResult).toBe(6);

    // Caso 3: Profesional con plan Premium activo
    const premiumResult = resolveMaxPhotos({ planFeatures: { max_photos: 15 } }, { max_photos: 3 });
    expect(premiumResult).toBe(15);
  });

  it("regla de negocio: máximo 15 servicios por perfil", () => {
    expect(MAX_SERVICES_PER_PROFESSIONAL).toBe(15);

    const canAddService = (currentServicesCount: number) => {
      return currentServicesCount < MAX_SERVICES_PER_PROFESSIONAL;
    };

    expect(canAddService(0)).toBe(true);
    expect(canAddService(14)).toBe(true);
    expect(canAddService(15)).toBe(false);
    expect(canAddService(16)).toBe(false);
  });

  it("debe construir correctamente las URLs públicas de media", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";

    expect(getPublicMediaUrl(null)).toBeNull();
    expect(getPublicMediaUrl("")).toBeNull();

    // URL absoluta previa
    expect(getPublicMediaUrl("https://cdn.example.com/foto.webp")).toBe(
      "https://cdn.example.com/foto.webp"
    );

    // Ruta en bucket professional-media
    expect(getPublicMediaUrl("prof-123/uuid.webp")).toBe(
      "https://example.supabase.co/storage/v1/object/public/professional-media/prof-123/uuid.webp"
    );
  });
});
