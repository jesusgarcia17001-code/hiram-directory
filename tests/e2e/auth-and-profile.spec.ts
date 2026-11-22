import { test, expect } from "@playwright/test";

test.describe("Fase 2: Autenticación y Protección de Rutas", () => {
  test("debe redirigir al login si un usuario no autenticado intenta acceder a /panel", async ({
    page,
  }) => {
    await page.goto("/panel");

    // Debe ser redirigido a /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 2 })).toContainText(
      "Iniciar sesión"
    );
  });

  test("debe redirigir al login si un usuario no autenticado intenta acceder a /panel/perfil", async ({
    page,
  }) => {
    await page.goto("/panel/perfil");

    // Debe ser redirigido a /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 2 })).toContainText(
      "Iniciar sesión"
    );
  });

  test("debe redirigir al login si un usuario no autenticado intenta acceder a /admin", async ({
    page,
  }) => {
    await page.goto("/admin");

    // Debe ser redirigido a /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 2 })).toContainText(
      "Iniciar sesión"
    );
  });

  test("la página de login debe mostrar los campos y enlaces necesarios", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ingresar al panel" })
    ).toBeVisible();

    // Enlace a registrarse
    const registerLink = page.getByRole("link", { name: "Regístrate gratis" });
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("la página de registro debe mostrar los campos y enlaces requeridos", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(
      page.getByLabel("Nombre completo o representante")
    ).toBeVisible();
    await expect(page.getByLabel("Correo electrónico")).toBeVisible();
    await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirmar contraseña")).toBeVisible();
    await expect(page.getByLabel(/acepto los términos/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Términos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Política de Privacidad" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Crear cuenta gratis" })
    ).toBeVisible();

    // Enlace para volver al login
    const loginLink = page.getByRole("link", { name: /inicia sesión aquí/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
