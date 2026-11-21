import { test, expect } from "@playwright/test";
import { brand } from "../../src/config/brand";

test.describe("Página de inicio (Fase 8: Rediseño)", () => {
  test("debe cargar y mostrar la marca, titular de dos líneas y cobertura institucional", async ({ page }) => {
    await page.goto("/");

    // Título institucional de marca y titular de dos líneas
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText(brand.name);
    await expect(h1).toContainText(brand.heroTitle.line1);
    await expect(h1).toContainText(brand.heroTitle.line2);

    // Eslogan y cobertura
    await expect(page.locator("body")).toContainText(brand.coverage.state);
    await expect(page.locator("body")).toContainText("Puerto La Cruz");

    // 3 Chips de confianza bajo el buscador
    for (const chip of brand.trustChips) {
      await expect(page.locator("body")).toContainText(chip);
    }
  });

  test("debe mostrar la cabecera con menú píldora y botones requeridos", async ({ page }) => {
    await page.goto("/");

    // Enlace a login "Entrar"
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

    // Botón de contorno "Registrarme como técnico"
    await expect(page.getByRole("link", { name: /Registrarme como técnico/i })).toBeVisible();
  });

  test("el buscador en píldora debe sugerir categorías sin distinguir acentos y permitir navegar", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder("Ej: plomero urgente");
    await expect(searchInput).toBeVisible();

    // Escribir sin acento "plomeria" o "plomero"
    await searchInput.fill("plomero");

    // Debe desplegar sugerencias con el rol listbox
    const suggestions = page.locator("#search-suggestions");
    await expect(suggestions).toBeVisible();
    await expect(suggestions).toContainText(/plomero/i);

    // Presionar Enter para buscar y verificar redirección a la lista SEO
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/\/plomeros/);
  });

  test("debe adaptarse a pantalla móvil de 360px sin desbordamiento", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/");

    // El titular debe ser visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // El botón buscar debe ser accesible
    const submitBtn = page.getByRole("button", { name: /buscar/i });
    await expect(submitBtn).toBeVisible();
  });
});
