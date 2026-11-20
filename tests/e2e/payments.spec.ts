import { test, expect } from "@playwright/test";

test.describe("Fase 5: Módulos de Pagos y Suscripción", () => {
  test("debe redirigir al login si un usuario no autenticado intenta acceder a /panel/suscripcion", async ({
    page,
  }) => {
    await page.goto("/panel/suscripcion");
    await expect(page).toHaveURL(/\/login/);
  });

  test("debe redirigir al login si un usuario no autenticado intenta acceder a /admin/pagos", async ({
    page,
  }) => {
    await page.goto("/admin/pagos");
    await expect(page).toHaveURL(/\/login/);
  });
});
