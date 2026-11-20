import { describe, it, expect } from "vitest";
import { brand } from "@/config/brand";
import manifest from "@/app/manifest";

describe("Brand Configuration (CLAUDE.md)", () => {
  it("debe contener el nombre provisional oficial", () => {
    expect(brand.name).toBe("HIRAM Directory");
    expect(brand.shortName).toBe("HIRAM");
  });

  it("debe definir la cobertura inicial en Anzoátegui", () => {
    expect(brand.coverage.state).toBe("Anzoátegui");
    expect(brand.coverage.primaryCities).toContain("Puerto La Cruz");
    expect(brand.coverage.primaryCities).toContain("Barcelona");
  });

  it("debe contener la paleta de colores institucional", () => {
    expect(brand.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(brand.colors.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(brand.colors.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("el manifest de la PWA debe heredar los valores de brand.ts", () => {
    const pwaManifest = manifest();
    expect(pwaManifest.name).toBe(brand.name);
    expect(pwaManifest.short_name).toBe(brand.shortName);
    expect(pwaManifest.theme_color).toBe(brand.colors.primary);
    expect(pwaManifest.icons?.length).toBeGreaterThanOrEqual(2);
  });
});
