import { test, expect } from "@playwright/test";

test.describe("Fase 3: SEO, Sitemap y Directorio Público", () => {
  test("debe generar un robots.txt válido protegiendo rutas privadas", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const text = await response.text();
    expect(text).toMatch(/user-agent:\s*\*/i);
    expect(text).toContain("Disallow: /admin");
    expect(text).toContain("Disallow: /panel");
    expect(text).toContain("Disallow: /login");
    expect(text).toContain("Disallow: /register");
    expect(text).toContain("sitemap.xml");
  });

  test("debe servir el sitemap.xml dinámico con las categorías principales", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const xml = await response.text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain("/plomeros");
    expect(xml).toContain("/electricistas");

    // Regla de seguridad: rutas privadas fuera del sitemap
    expect(xml).not.toContain("/admin");
    expect(xml).not.toContain("/panel");
    expect(xml).not.toContain("/login");
  });

  test("la página de categoría general debe mostrar encabezado y migas de pan", async ({
    page,
  }) => {
    await page.goto("/plomeros");

    await expect(page).toHaveTitle(/Plomeros en Anzoátegui/i);
    await expect(
      page.getByRole("heading", { level: 1, name: /Plomeros en Anzoátegui/i })
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Migas de pan" })).toBeVisible();
  });
});
