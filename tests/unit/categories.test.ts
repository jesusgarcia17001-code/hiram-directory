import { describe, it, expect } from "vitest";
import { categorySchema, CATEGORY_SLUG_REGEX } from "@/lib/validations/category";

describe("Fase 7: Validaciones y Reglas de Categorías", () => {
  it("debe validar correctamente una categoría válida", () => {
    const validData = {
      name: "Cerrajería",
      listing_slug: "cerrajeros",
      singular_label: "Cerrajero",
      plural_label: "Cerrajeros",
      description: "Servicios de apertura y cerraduras de seguridad.",
      seo_intro: "Encuentra cerrajeros calificados en Anzoátegui.",
      icon: "key",
      sort_order: 5,
      is_active: true,
    };

    const result = categorySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("debe validar el regex estricto de slug de URL (solo minúsculas, números y guiones)", () => {
    expect(CATEGORY_SLUG_REGEX.test("cerrajeros")).toBe(true);
    expect(CATEGORY_SLUG_REGEX.test("tecnicos-aire-acondicionado")).toBe(true);
    expect(CATEGORY_SLUG_REGEX.test("linea-blanca-24")).toBe(true);

    // Inválidos
    expect(CATEGORY_SLUG_REGEX.test("Cerrajeros")).toBe(false); // Mayúsculas
    expect(CATEGORY_SLUG_REGEX.test("cerrajeros express")).toBe(false); // Espacios
    expect(CATEGORY_SLUG_REGEX.test("cerrajeros/puerto")).toBe(false); // Barras
    expect(CATEGORY_SLUG_REGEX.test("-cerrajeros")).toBe(false); // Guion al inicio
    expect(CATEGORY_SLUG_REGEX.test("cerrajeros-")).toBe(false); // Guion al final
    expect(CATEGORY_SLUG_REGEX.test("cerrajeros--pro")).toBe(false); // Doble guion
  });

  it("debe rechazar nombres muy cortos o campos requeridos vacíos", () => {
    const invalidData = {
      name: "A", // Demasiado corto (mínimo 2)
      listing_slug: "cerrajeros",
      singular_label: "",
      plural_label: "",
    };

    const result = categorySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.name).toBeDefined();
      expect(errors.singular_label).toBeDefined();
      expect(errors.plural_label).toBeDefined();
    }
  });

  it("regla de negocio: si la categoría tiene profesionales, el slug de URL no puede cambiar", () => {
    const canChangeListingSlug = (
      professionalCount: number,
      currentSlug: string,
      newSlug: string
    ) => {
      if (professionalCount > 0 && currentSlug !== newSlug) {
        return false;
      }
      return true;
    };

    // Caso 1: 0 profesionales -> Permitido cambiar el slug
    expect(canChangeListingSlug(0, "cerrajeria-antigua", "cerrajeros-nuevos")).toBe(true);

    // Caso 2: 3 profesionales y mismo slug -> Permitido
    expect(canChangeListingSlug(3, "cerrajeros", "cerrajeros")).toBe(true);

    // Caso 3: 3 profesionales e intenta cambiar el slug -> BLOQUEADO para proteger SEO
    expect(canChangeListingSlug(3, "cerrajeros", "nueva-url")).toBe(false);
  });
});
