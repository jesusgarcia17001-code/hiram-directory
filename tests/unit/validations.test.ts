import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import {
  profileSchema,
  normalizePhoneToE164,
  slugify,
  VENEZUELA_PHONE_REGEX,
} from "@/lib/validations/profile";
import { sanitizeSupabaseUrl } from "@/lib/supabase/utils";

describe("Sanitización de URL de Supabase", () => {
  it("debe limpiar barras finales y subrutas accidentales", () => {
    expect(sanitizeSupabaseUrl("https://xyz.supabase.co/")).toBe("https://xyz.supabase.co");
    expect(sanitizeSupabaseUrl("https://xyz.supabase.co///")).toBe("https://xyz.supabase.co");
    expect(sanitizeSupabaseUrl("https://xyz.supabase.co/rest/v1")).toBe("https://xyz.supabase.co");
    expect(sanitizeSupabaseUrl(" https://xyz.supabase.co ")).toBe("https://xyz.supabase.co");
    expect(sanitizeSupabaseUrl('"https://xyz.supabase.co"')).toBe("https://xyz.supabase.co");
  });
});

describe("Validaciones de Teléfonos y Normalización E.164 (CLAUDE.md)", () => {
  it("debe normalizar formatos locales venezolanos a +58 internacional", () => {
    expect(normalizePhoneToE164("0414-1234567")).toBe("+584141234567");
    expect(normalizePhoneToE164("0424 555 1234")).toBe("+584245551234");
    expect(normalizePhoneToE164("04121112233")).toBe("+584121112233");
    expect(normalizePhoneToE164("4161234567")).toBe("+584161234567");
    expect(normalizePhoneToE164("+584141234567")).toBe("+584141234567");
  });

  it("debe validar con regex estricto E.164 de Venezuela", () => {
    expect(VENEZUELA_PHONE_REGEX.test("+584141234567")).toBe(true);
    expect(VENEZUELA_PHONE_REGEX.test("+582811234567")).toBe(true);
    expect(VENEZUELA_PHONE_REGEX.test("04141234567")).toBe(false); // sin código de país
    expect(VENEZUELA_PHONE_REGEX.test("+5841412345")).toBe(false); // muy corto
  });
});

describe("Generación de Slugs (SEO y URLs limpias)", () => {
  it("debe limpiar tildes y caracteres especiales", () => {
    expect(slugify("Plomería & Gas Los Andes")).toBe("plomeria-gas-los-andes");
    expect(slugify("Refrigeración Barcelona C.A.")).toBe("refrigeracion-barcelona-c-a");
    expect(slugify("  Técnico Eléctrico 24/7  ")).toBe("tecnico-electrico-24-7");
  });
});

describe("Esquemas de Autenticación (auth.ts)", () => {
  it("loginSchema debe validar correo y contraseña correctos", () => {
    const result = loginSchema.safeParse({
      email: "tecnico@ejemplo.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("loginSchema debe rechazar correos inválidos", () => {
    const result = loginSchema.safeParse({
      email: "correo-invalido",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("registerSchema debe rechazar cuando las contraseñas no coinciden", () => {
    const result = registerSchema.safeParse({
      full_name: "Pedro Pérez",
      email: "pedro@test.com",
      password: "password123",
      confirm_password: "passwordDiferente",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Las contraseñas no coinciden.");
    }
  });
});

describe("Esquema de Perfil de Profesional y Empresa (profile.ts)", () => {
  const dummyUUID1 = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
  const dummyUUID2 = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

  it("debe validar correctamente un técnico independiente", () => {
    const data = {
      business_name: "Carlos Plomería Express",
      provider_type: "individual",
      id_type: "V",
      id_number: "18234567",
      locality_id: dummyUUID1,
      category_id: dummyUUID2,
      description: "Servicios de plomería y destape de cañerías en Puerto La Cruz.",
      experience_years: 5,
      whatsapp_phone: "0414-1234567",
      phone: "0281-2821234",
      service_areas: ["Puerto La Cruz", "Barcelona"],
    };
    const result = profileSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.whatsapp_phone).toBe("+584141234567");
      expect(result.data.phone).toBe("+582812821234");
    }
  });

  it("debe validar correctamente una empresa con RIF J-", () => {
    const data = {
      business_name: "Refriservicios Oriente C.A.",
      provider_type: "company",
      id_type: "J",
      id_number: "401234567",
      locality_id: dummyUUID1,
      category_id: dummyUUID2,
      description: "Mantenimiento e instalación de aire acondicionado industrial y residencial.",
      experience_years: 12,
      whatsapp_phone: "+584241234567",
      phone: "",
      service_areas: ["Barcelona", "Puerto La Cruz", "Lechería"],
    };
    const result = profileSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.provider_type).toBe("company");
      expect(result.data.id_type).toBe("J");
    }
  });

  it("debe rechazar documentos con letras o longitudes inválidas", () => {
    const data = {
      business_name: "Técnico Test",
      provider_type: "individual",
      id_type: "V",
      id_number: "123", // Muy corto (mínimo 5)
      locality_id: dummyUUID1,
      category_id: dummyUUID2,
      experience_years: 2,
      whatsapp_phone: "04141234567",
    };
    const result = profileSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
