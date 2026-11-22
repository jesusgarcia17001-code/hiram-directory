import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Privacidad estricta de Cédula y RIF", () => {
  const rootDir = process.cwd();

  it("la vista professionals_public no debe incluir id_type ni id_number", () => {
    const migrationFile = path.join(
      rootDir,
      "supabase",
      "migrations",
      "20261120100000_add_provider_type.sql"
    );
    expect(fs.existsSync(migrationFile)).toBe(true);
    const content = fs.readFileSync(migrationFile, "utf-8");

    // Extraer la definición de la vista create view public.professionals_public as ...
    const viewMatch = content.match(/create view public\.professionals_public as([\s\S]*?)where p\.status = 'approved';/i);
    expect(viewMatch).toBeTruthy();
    const viewDefinition = viewMatch![1];

    expect(viewDefinition).not.toContain("id_type");
    expect(viewDefinition).not.toContain("id_number");
  });

  it("la interfaz pública PublicProfessionalSummary en TypeScript no debe exponer campos de documento", () => {
    const typesFile = path.join(rootDir, "src", "services", "directory.ts");
    expect(fs.existsSync(typesFile)).toBe(true);
    const content = fs.readFileSync(typesFile, "utf-8");

    const match = content.match(/export interface PublicProfessionalSummary {([\s\S]*?)}/);
    expect(match).toBeTruthy();
    const interfaceDefinition = match![1];

    expect(interfaceDefinition).not.toContain("id_type");
    expect(interfaceDefinition).not.toContain("id_number");
  });

  it("el componente de tarjeta pública ProfessionalCard no debe renderizar id_type ni id_number", () => {
    const cardFile = path.join(rootDir, "src", "components", "directory", "ProfessionalCard.tsx");
    expect(fs.existsSync(cardFile)).toBe(true);
    const content = fs.readFileSync(cardFile, "utf-8");

    expect(content).not.toContain("id_type");
    expect(content).not.toContain("id_number");
  });

  it("la página de perfil público no debe consultar ni renderizar id_type ni id_number", () => {
    const profileFile = path.join(rootDir, "src", "app", "[categoria]", "[localidad]", "[slug]", "page.tsx");
    expect(fs.existsSync(profileFile)).toBe(true);
    const content = fs.readFileSync(profileFile, "utf-8");

    expect(content).not.toContain("id_type");
    expect(content).not.toContain("id_number");
  });

  it("la migración del índice único sobre (id_type, id_number) debe existir y ser condicional", () => {
    const migrationFile = path.join(
      rootDir,
      "supabase",
      "migrations",
      "20261122120000_unique_professional_id_document.sql"
    );
    expect(fs.existsSync(migrationFile)).toBe(true);
    const content = fs.readFileSync(migrationFile, "utf-8");

    expect(content).toContain("create unique index if not exists professionals_id_document_unique_idx");
    expect(content).toContain("(id_type, id_number)");
    expect(content).toContain("where id_type is not null and id_number is not null");
  });

  it("la página /privacidad debe existir y contener las explicaciones sobre la confidencialidad de la cédula y RIF", () => {
    const privacyFile = path.join(rootDir, "src", "app", "privacidad", "page.tsx");
    expect(fs.existsSync(privacyFile)).toBe(true);
    const content = fs.readFileSync(privacyFile, "utf-8");

    expect(content).toContain("Tu cédula o RIF");
    expect(content).toContain("nunca se muestra públicamente");
    expect(content).toContain("perfiles falsos");
  });
});
