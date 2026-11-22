import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Fase: Perfiles Semilla SEO (25 perfiles en 5 categorías)", () => {
  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/20261122150000_seed_seo_profiles.sql"
  );
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");

  it("debe existir el archivo de migración", () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it("debe crear o asegurar las categorías Herrería y Albañilería con listing_slugs correctos", () => {
    expect(migrationSql).toContain("'Herrería', 'herreria', 'herreros'");
    expect(migrationSql).toContain("'Albañilería', 'albanileria', 'albaniles'");
  });

  it("debe activar la localidad de Lechería para que sus listas SEO sean públicas", () => {
    expect(migrationSql).toContain("where slug = 'diego-bautista-urbaneja'");
    expect(migrationSql).toContain("where slug = 'lecheria'");
  });

  it("debe contener exactamente 25 slugs únicos de profesionales", () => {
    const slugMatches = migrationSql.match(/slug = '([a-z0-9\-]+)'/g) || [];
    // Filtrar los slugs de categorías y localidades
    const profSlugs = slugMatches
      .map((s) => s.replace("slug = '", "").replace("'", ""))
      .filter(
        (s) =>
          ![
            "diego-bautista-urbaneja",
            "lecheria",
            "puerto-la-cruz",
            "barcelona",
            "plomeria",
            "herreria",
            "albanileria",
            "aire-acondicionado",
            "electricidad",
          ].includes(s)
      );

    expect(profSlugs.length).toBe(25);
    const uniqueSlugs = new Set(profSlugs);
    expect(uniqueSlugs.size).toBe(25);
  });

  it("todos los teléfonos venezolanos simulados deben cumplir con el formato internacional E.164 (+58...)", () => {
    const phoneMatches = migrationSql.match(/\+58\d{10}/g) || [];
    expect(phoneMatches.length).toBeGreaterThanOrEqual(25);
    for (const phone of phoneMatches) {
      expect(phone).toMatch(/^\+58[1-9][0-9]{9}$/);
    }
  });

  it("todos los perfiles deben crearse con status = 'approved' para visibilidad pública inmediata", () => {
    const approvedMatches = migrationSql.match(/'approved'/g) || [];
    // Debe haber al menos 25 ocurrencias de 'approved'
    expect(approvedMatches.length).toBeGreaterThanOrEqual(25);
  });
});
