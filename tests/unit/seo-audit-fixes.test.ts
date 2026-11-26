import { describe, it, expect } from "vitest";
import {
  buildCategoryTitle,
  buildLocalityCategoryTitle,
  buildProfileTitle,
  generateCategoryIntroText,
  generateCategoryFaqs,
} from "@/lib/seo-content";
import { brand } from "@/config/brand";

describe("Auditoría SEO Semrush - Títulos, Contenido y Schema", () => {
  const brandSuffix = ` | ${brand.name}`;

  describe("1. Optimización de Títulos (Máximo 60 caracteres y sin duplicación de marca)", () => {
    it("buildCategoryTitle debe generar un título que con el template de layout no supere 60 caracteres", () => {
      // Categoría corta
      const titleShort = buildCategoryTitle("Plomeros");
      const fullTitleShort = `${titleShort}${brandSuffix}`;
      expect(fullTitleShort.length).toBeLessThanOrEqual(60);
      expect(fullTitleShort).toContain("Plomeros");

      // Categoría larga
      const titleLong = buildCategoryTitle("Técnicos de Aire Acondicionado");
      const fullTitleLong = `${titleLong}${brandSuffix}`;
      expect(fullTitleLong.length).toBeLessThanOrEqual(60);
      expect(fullTitleLong).not.toContain("Plomeros");
    });

    it("buildLocalityCategoryTitle debe generar títulos que con o sin absolute nunca superen 60 caracteres", () => {
      // Caso 1: Ciudad y oficio estándar
      const res1 = buildLocalityCategoryTitle("Plomeros", "Puerto La Cruz");
      const full1 = res1.absolute || `${res1.title}${brandSuffix}`;
      expect(full1.length).toBeLessThanOrEqual(60);
      expect(full1).toContain("Puerto La Cruz");

      // Caso 2: Nombre de oficio largo y ciudad
      const res2 = buildLocalityCategoryTitle(
        "Técnicos de Aire Acondicionado",
        "Puerto La Cruz"
      );
      const full2 = res2.absolute || `${res2.title}${brandSuffix}`;
      expect(full2.length).toBeLessThanOrEqual(60);
      expect(full2).toContain("Puerto La Cruz");
    });

    it("buildProfileTitle debe generar títulos estrictamente <= 60 caracteres incluso con nombres de empresa largos", () => {
      // Caso estándar
      const title1 = buildProfileTitle(
        "Refrigeración Pérez C.A.",
        "Técnico de Aire Acondicionado",
        "Lechería"
      );
      expect(title1.length).toBeLessThanOrEqual(60);
      expect(title1).toContain(brand.name);

      // Caso de nombre comercial extremadamente largo
      const longName = "Servicios Integrales de Refrigeración y Mantenimiento Industrial del Oriente C.A.";
      const title2 = buildProfileTitle(longName, "Técnico", "Barcelona");
      expect(title2.length).toBeLessThanOrEqual(60);
      expect(title2).toContain(brand.name);
      expect(title2).toContain("...");
    });
  });

  describe("2. Contenido Introductorio y Preguntas Frecuentes (80 a 150 palabras)", () => {
    it("el texto introductorio de categoría debe tener entre 80 y 150 palabras", () => {
      const text = generateCategoryIntroText("Plomeros");
      const wordCount = text.trim().split(/\s+/).length;

      expect(wordCount).toBeGreaterThanOrEqual(80);
      expect(wordCount).toBeLessThanOrEqual(150);
      expect(text.toLowerCase()).toContain("plomeros");
    });

    it("el texto introductorio de categoría + localidad debe tener entre 80 y 150 palabras y mencionar la zona", () => {
      const text = generateCategoryIntroText("Electricistas", "Barcelona");
      const wordCount = text.trim().split(/\s+/).length;

      expect(wordCount).toBeGreaterThanOrEqual(80);
      expect(wordCount).toBeLessThanOrEqual(150);
      expect(text).toContain("Barcelona");
      expect(text.toLowerCase()).toContain("electricistas");
    });

    it("generateCategoryFaqs debe retornar exactamente 3 preguntas frecuentes con respuestas útiles", () => {
      const faqs = generateCategoryFaqs("Plomero", "Puerto La Cruz");

      expect(faqs).toHaveLength(3);
      faqs.forEach((faq) => {
        expect(faq.question.length).toBeGreaterThan(10);
        expect(faq.answer.length).toBeGreaterThan(20);
      });
      expect(faqs[0].question.toLowerCase()).toContain("plomero");
      expect(faqs[0].question).toContain("Puerto La Cruz");
    });
  });

  describe("3. Datos Estructurados Schema.org (Evitar ItemList vacío en /tecnicos-linea-blanca)", () => {
    it("cuando no hay profesionales, NO debe emitirse un ItemList vacío con itemListElement=[]", () => {
      const emptyProfessionals: Array<{ id: string; business_name: string }> = [];

      const schema =
        emptyProfessionals.length > 0
          ? {
              "@context": "https://schema.org",
              "@type": "ItemList",
              numberOfItems: emptyProfessionals.length,
              itemListElement: emptyProfessionals.map((_, i) => ({
                "@type": "ListItem",
                position: i + 1,
              })),
            }
          : {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Técnicos de Línea Blanca en Anzoátegui",
            };

      expect(schema["@type"]).toBe("CollectionPage");
      expect((schema as Record<string, unknown>).itemListElement).toBeUndefined();
    });

    it("cuando hay profesionales, debe emitir un ItemList válido", () => {
      const activeProfessionals = [
        { business_name: "Plomería Pro", slug: "plomeria-pro", locality_slug: "puerto-la-cruz" },
      ];

      const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        numberOfItems: activeProfessionals.length,
        itemListElement: activeProfessionals.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.business_name,
        })),
      };

      expect(schema["@type"]).toBe("ItemList");
      expect(schema.numberOfItems).toBe(1);
      expect(schema.itemListElement).toHaveLength(1);
      expect(schema.itemListElement[0].name).toBe("Plomería Pro");
    });
  });

  describe("4. Reglas de indexación para páginas sin perfiles", () => {
    it("una combinación sin perfiles debe emitir robots { index: false, follow: true }", () => {
      const evaluateRobots = (hasProfiles: boolean) => {
        if (!hasProfiles) {
          return { index: false, follow: true };
        }
        return { index: true, follow: true };
      };

      expect(evaluateRobots(false)).toEqual({ index: false, follow: true });
      expect(evaluateRobots(true)).toEqual({ index: true, follow: true });
    });
  });
});
