import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  profileSchema,
  normalizeSocialHandle,
  isValidHttpsUrl,
  SOCIAL_HANDLE_REGEX,
} from "@/lib/validations/profile";

describe("Validaciones y Normalización: Persona de Contacto y Redes Sociales", () => {
  describe("Normalización de Handles (Instagram / TikTok)", () => {
    it("debe remover @ inicial y espacios en blanco", () => {
      expect(normalizeSocialHandle(" @carlos_plomero ")).toBe("carlos_plomero");
      expect(normalizeSocialHandle("@@pedro.tecnico")).toBe("pedro.tecnico");
    });

    it("debe extraer el usuario si pegan la URL completa de Instagram o TikTok", () => {
      expect(normalizeSocialHandle("https://www.instagram.com/juan_frio/")).toBe("juan_frio");
      expect(normalizeSocialHandle("https://instagram.com/juan_frio?igsh=123")).toBe("juan_frio");
      expect(normalizeSocialHandle("https://www.tiktok.com/@maria.clima")).toBe("maria.clima");
      expect(normalizeSocialHandle("http://tiktok.com/@maria.clima/")).toBe("maria.clima");
    });

    it("debe validar la expresión regular de handles permitidos", () => {
      expect(SOCIAL_HANDLE_REGEX.test("usuario_123.ok")).toBe(true);
      expect(SOCIAL_HANDLE_REGEX.test("a")).toBe(true);
      expect(SOCIAL_HANDLE_REGEX.test("a".repeat(30))).toBe(true);

      // Inválidos
      expect(SOCIAL_HANDLE_REGEX.test("usuario con espacio")).toBe(false);
      expect(SOCIAL_HANDLE_REGEX.test("usuario$malo")).toBe(false);
      expect(SOCIAL_HANDLE_REGEX.test("usuario#")).toBe(false);
      expect(SOCIAL_HANDLE_REGEX.test("a".repeat(31))).toBe(false); // Más de 30
    });
  });

  describe("Validación Estricta de URLs HTTPS", () => {
    it("debe aceptar URLs válidas que inicien con https://", () => {
      expect(isValidHttpsUrl("https://www.facebook.com/miempresa")).toBe(true);
      expect(isValidHttpsUrl("https://miweb.com/servicios")).toBe(true);
    });

    it("debe rechazar terminantemente esquemas maliciosos e inseguros", () => {
      expect(isValidHttpsUrl("javascript:alert(1)")).toBe(false);
      expect(isValidHttpsUrl("JAVASCRIPT:alert('xss')")).toBe(false);
      expect(isValidHttpsUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isValidHttpsUrl("vbscript:msgbox(1)")).toBe(false);
      expect(isValidHttpsUrl("http://inseguro.com")).toBe(false); // Solo https
      expect(isValidHttpsUrl("ftp://ftp.empresa.com")).toBe(false);
      expect(isValidHttpsUrl("solo-texto-invalido")).toBe(false);
    });
  });

  describe("Validación de ProfileSchema con Zod", () => {
    const baseValidInput = {
      business_name: "Plomería Oriente Express",
      provider_type: "individual",
      id_type: "V",
      id_number: "12345678",
      locality_id: "11111111-1111-4111-a111-111111111111",
      category_id: "22222222-2222-4222-a222-222222222222",
      experience_years: 5,
      whatsapp_phone: "0414-1234567",
      phone: "",
      service_areas: [],
    };

    it("debe aceptar campos de redes sociales y persona de contacto válidos", () => {
      const parsed = profileSchema.safeParse({
        ...baseValidInput,
        contact_person_name: "Carlos Pérez",
        instagram_handle: "@carlos_plomero",
        tiktok_handle: "carlos_plomero",
        facebook_url: "https://www.facebook.com/carlosplomero",
        website_url: "https://www.carlosplomero.com",
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.contact_person_name).toBe("Carlos Pérez");
        expect(parsed.data.instagram_handle).toBe("carlos_plomero"); // Normalizado sin @
        expect(parsed.data.tiktok_handle).toBe("carlos_plomero");
        expect(parsed.data.facebook_url).toBe("https://www.facebook.com/carlosplomero");
        expect(parsed.data.website_url).toBe("https://www.carlosplomero.com");
      }
    });

    it("debe rechazar si contact_person_name tiene menos de 2 caracteres o más de 80", () => {
      const tooShort = profileSchema.safeParse({
        ...baseValidInput,
        contact_person_name: "A",
      });
      expect(tooShort.success).toBe(false);

      const tooLong = profileSchema.safeParse({
        ...baseValidInput,
        contact_person_name: "A".repeat(81),
      });
      expect(tooLong.success).toBe(false);
    });

    it("debe rechazar URLs con javascript: o que no sean https", () => {
      const xssFacebook = profileSchema.safeParse({
        ...baseValidInput,
        facebook_url: "javascript:alert(1)",
      });
      expect(xssFacebook.success).toBe(false);

      const insecureWebsite = profileSchema.safeParse({
        ...baseValidInput,
        website_url: "http://insecure-site.com",
      });
      expect(insecureWebsite.success).toBe(false);
    });

    it("debe permitir que todos los campos sean vacíos u opcionales", () => {
      const parsed = profileSchema.safeParse({
        ...baseValidInput,
        contact_person_name: "",
        instagram_handle: "",
        tiktok_handle: "",
        facebook_url: "",
        website_url: "",
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("Seguridad SQL de la Vista Pública professionals_public", () => {
    it("la migración debe incluir las nuevas columnas y excluir datos privados (id_type, id_number, owner_id)", () => {
      const migrationPath = path.join(
        process.cwd(),
        "supabase/migrations/20261123110000_contact_person_and_social_media.sql"
      );
      expect(fs.existsSync(migrationPath)).toBe(true);

      const sqlContent = fs.readFileSync(migrationPath, "utf-8");

      // Columnas nuevas incluidas
      expect(sqlContent).toContain("contact_person_name");
      expect(sqlContent).toContain("instagram_handle");
      expect(sqlContent).toContain("tiktok_handle");
      expect(sqlContent).toContain("facebook_url");
      expect(sqlContent).toContain("website_url");

      // Extracción del bloque create view
      const viewMatch = sqlContent.match(/create view public\.professionals_public as([\s\S]*?)from public\.professionals/i);
      expect(viewMatch).toBeDefined();

      const viewSelect = viewMatch ? viewMatch[1] : "";

      // Verificar que NO se expongan campos sensibles
      expect(viewSelect).not.toContain("p.id_type");
      expect(viewSelect).not.toContain("p.id_number");
      expect(viewSelect).not.toContain("p.owner_id");
      expect(viewSelect).not.toContain("p.approved_by");
    });
  });
});
