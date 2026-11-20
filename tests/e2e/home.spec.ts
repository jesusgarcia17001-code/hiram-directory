import { test, expect } from "@playwright/test";
import { brand } from "../../src/config/brand";

test.describe("Página de inicio", () => {
  test("debe cargar y mostrar la marca y cobertura institucional", async ({ page }) => {
    await page.goto("/");

    // Título institucional de marca
    await expect(page.getByRole("heading", { level: 1 })).toContainText(brand.name);

    // Eslogan y cobertura
    await expect(page.locator("body")).toContainText(brand.coverage.state);
    await expect(page.locator("body")).toContainText("Puerto La Cruz");
  });
});
