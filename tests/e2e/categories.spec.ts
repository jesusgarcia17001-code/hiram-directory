import { test, expect } from "@playwright/test";

test.describe("Fase 7: Gestión de Categorías", () => {
  test("debe redirigir al login si un usuario no autenticado intenta acceder a /admin/categorias", async ({
    page,
  }) => {
    await page.goto("/admin/categorias");
    await expect(page).toHaveURL(/\/login/);
  });
});
