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
    expect(brand.colors.primary).toBe("#0B2A5B");
    expect(brand.colors.primaryDark).toBe("#081E42");
    expect(brand.colors.accent).toBe("#F97316");
    expect(brand.colors.accentDark).toBe("#C2410C");
    expect(brand.colors.surfaceSoft).toBe("#EAF0FA");
    expect(brand.colors.textMuted).toBe("#475569");
    expect(brand.colors.white).toBe("#FFFFFF");
  });

  it("el manifest de la PWA debe heredar los valores de brand.ts", () => {
    const pwaManifest = manifest();
    expect(pwaManifest.name).toBe(brand.name);
    expect(pwaManifest.short_name).toBe(brand.shortName);
    expect(pwaManifest.theme_color).toBe(brand.colors.primary);
    expect(pwaManifest.icons?.length).toBeGreaterThanOrEqual(2);
  });
});
