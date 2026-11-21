import { describe, it, expect } from "vitest";
import {
  stateSchema,
  municipalitySchema,
  localitySchema,
  LOCATION_SLUG_REGEX,
} from "@/lib/validations/locations";

describe("Fase 7, Paso 2: Validaciones y Reglas de Ubicaciones", () => {
  it("debe validar correctamente un estado válido", () => {
    const validState = {
      name: "Anzoátegui",
      slug: "anzoategui",
      is_active: true,
    };
    const res = stateSchema.safeParse(validState);
    expect(res.success).toBe(true);
  });

  it("debe validar correctamente un municipio válido", () => {
    const validMun = {
      state_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      name: "Juan Antonio Sotillo",
      slug: "juan-antonio-sotillo",
      is_active: true,
    };
    const res = municipalitySchema.safeParse(validMun);
    expect(res.success).toBe(true);
  });

  it("debe validar correctamente una localidad o zona rural válida", () => {
    const validLocality = {
      municipality_id: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      name: "Zona rural de Sotillo",
      slug: "zona-rural-sotillo",
      is_active: true,
    };
    const res = localitySchema.safeParse(validLocality);
    expect(res.success).toBe(true);
  });

  it("debe validar el regex estricto de slug de ubicaciones (solo minúsculas, números y guiones)", () => {
    expect(LOCATION_SLUG_REGEX.test("puerto-la-cruz")).toBe(true);
    expect(LOCATION_SLUG_REGEX.test("lecheria")).toBe(true);
    expect(LOCATION_SLUG_REGEX.test("zona-rural-1")).toBe(true);

    // Inválidos
    expect(LOCATION_SLUG_REGEX.test("Puerto-La-Cruz")).toBe(false); // Mayúsculas
    expect(LOCATION_SLUG_REGEX.test("puerto la cruz")).toBe(false); // Espacios
    expect(LOCATION_SLUG_REGEX.test("-puerto")).toBe(false); // Guion al inicio
    expect(LOCATION_SLUG_REGEX.test("puerto-")).toBe(false); // Guion al final
    expect(LOCATION_SLUG_REGEX.test("puerto--cruz")).toBe(false); // Doble guion
  });

  it("debe rechazar nombres muy cortos o campos requeridos vacíos", () => {
    const invalidLocality = {
      municipality_id: "invalid-uuid",
      name: "A",
      slug: "a",
    };
    const res = localitySchema.safeParse(invalidLocality);
    expect(res.success).toBe(false);
    if (!res.success) {
      const errors = res.error.flatten().fieldErrors;
      expect(errors.name).toBeDefined();
      expect(errors.municipality_id).toBeDefined();
    }
  });

  it("regla de negocio: si la localidad tiene profesionales aprobados, el slug no se puede cambiar", () => {
    const canChangeLocalitySlug = (
      professionalCount: number,
      currentSlug: string,
      newSlug: string
    ) => {
      if (professionalCount > 0 && currentSlug !== newSlug) {
        return false;
      }
      return true;
    };

    // Caso 1: Localidad con técnicos no permite cambiar el slug
    expect(canChangeLocalitySlug(3, "puerto-la-cruz", "plc-centro")).toBe(false);

    // Caso 2: Localidad con técnicos sí permite mantener el mismo slug
    expect(canChangeLocalitySlug(3, "puerto-la-cruz", "puerto-la-cruz")).toBe(true);

    // Caso 3: Localidad sin técnicos sí permite cambiar el slug
    expect(canChangeLocalitySlug(0, "nueva-barcelona", "barcelona-norte")).toBe(true);
  });

  it("regla de negocio: si una ubicación tiene profesionales, desactivarla requiere advertencia de impacto", () => {
    const requiresDeactivationWarning = (
      isActive: boolean,
      professionalCount: number
    ) => {
      // Si se intenta desactivar (está activa) y tiene técnicos, requiere advertencia
      return isActive && professionalCount > 0;
    };

    expect(requiresDeactivationWarning(true, 5)).toBe(true);
    expect(requiresDeactivationWarning(true, 0)).toBe(false);
    expect(requiresDeactivationWarning(false, 5)).toBe(false); // Si ya estaba inactiva y se va a activar
  });

  it("sugerencia automática de slug cuando existe colisión en localidades", () => {
    const resolveSlugCollision = (
      baseSlug: string,
      municipalitySlug: string
    ) => {
      return `${baseSlug}-${municipalitySlug}`;
    };

    // Si "zona-rural" ya existe, se sugiere "zona-rural-sotillo"
    expect(resolveSlugCollision("zona-rural", "sotillo")).toBe("zona-rural-sotillo");
  });
});
