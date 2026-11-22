import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Páginas Legales Públicas: /terminos y /privacidad", () => {
  const terminosPath = path.join(process.cwd(), "src/app/terminos/page.tsx");
  const privacidadPath = path.join(process.cwd(), "src/app/privacidad/page.tsx");
  const footerPath = path.join(process.cwd(), "src/components/layout/Footer.tsx");
  const registerPath = path.join(process.cwd(), "src/app/(auth)/register/page.tsx");

  it("debe existir el archivo /terminos/page.tsx con metadatos indexables", () => {
    expect(fs.existsSync(terminosPath)).toBe(true);
    const content = fs.readFileSync(terminosPath, "utf-8");
    expect(content).toContain("Términos y Condiciones de Uso — Ofir Oficios");
    expect(content).toContain("robots: {");
    expect(content).toContain("index: true");
    expect(content).toContain("follow: true");
    expect(content).toContain("jesusgarcia17001@gmail.com");
  });

  it("debe existir el archivo /privacidad/page.tsx con metadatos indexables", () => {
    expect(fs.existsSync(privacidadPath)).toBe(true);
    const content = fs.readFileSync(privacidadPath, "utf-8");
    expect(content).toContain("Política de Privacidad — Ofir Oficios");
    expect(content).toContain("robots: {");
    expect(content).toContain("index: true");
    expect(content).toContain("follow: true");
    expect(content).toContain("no guardamos tu dirección IP en nuestra base de datos");
    expect(content).toContain("Es un dato privado: nunca se muestra en tu perfil público");
  });

  it("el pie de página (Footer) debe contener enlaces visibles a /terminos y /privacidad", () => {
    expect(fs.existsSync(footerPath)).toBe(true);
    const content = fs.readFileSync(footerPath, "utf-8");
    expect(content).toContain('href="/terminos"');
    expect(content).toContain("Términos y Condiciones");
    expect(content).toContain('href="/privacidad"');
    expect(content).toContain("Política de Privacidad");
  });

  it("la página de registro debe incluir la casilla obligatoria de aceptación de términos", () => {
    expect(fs.existsSync(registerPath)).toBe(true);
    const content = fs.readFileSync(registerPath, "utf-8");
    expect(content).toContain('name="terms_accepted"');
    expect(content).toContain('href="/terminos"');
    expect(content).toContain('href="/privacidad"');
    expect(content).toContain("Acepto los");
  });
});
