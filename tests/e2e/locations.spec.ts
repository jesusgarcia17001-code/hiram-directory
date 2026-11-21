import { test, expect } from "@playwright/test";

test.describe("Fase 7, Paso 2: Gestión de Ubicaciones", () => {
  test("debe redirigir al login si un usuario no autenticado intenta acceder a /admin/ubicaciones", async ({
    page,
  }) => {
    await page.goto("/admin/ubicaciones");
    await expect(page).toHaveURL(/\/login/);
  });
});
