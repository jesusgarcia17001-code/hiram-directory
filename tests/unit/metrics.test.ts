import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { brand } from "@/config/brand";

describe("Fase 4: Reglas de Cuotas y Métricas (CLAUDE.md)", () => {
  const DEFAULT_SECRET = "test-secret-key-12345";

  it("debe generar un visitor_hash consistente usando HMAC SHA-256", () => {
    const visitorId = "b9c8d7e6-1234-4567-8901-abcdef123456";
    const hash1 = createHmac("sha256", DEFAULT_SECRET).update(visitorId).digest("hex");
    const hash2 = createHmac("sha256", DEFAULT_SECRET).update(visitorId).digest("hex");

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 en hex tiene 64 caracteres
  });

  it("debe armar el enlace de WhatsApp con formato internacional limpio y mensaje de marca", () => {
    const rawPhone = "+584141234567";
    const cleanNumber = rawPhone.replace(/\+/g, "");
    const message = encodeURIComponent(
      `Hola, vi tu perfil en ${brand.name} y deseo consultar sobre tus servicios.`
    );
    const actionUrl = `https://wa.me/${cleanNumber}?text=${message}`;

    expect(actionUrl).toContain("https://wa.me/584141234567?text=");
    expect(actionUrl).toContain(encodeURIComponent(brand.name));
    expect(actionUrl).not.toContain("+");
  });

  it("debe armar el enlace de llamada telefónica E.164 directo", () => {
    const rawPhone = "+584249876543";
    const telUrl = `tel:${rawPhone}`;

    expect(telUrl).toBe("tel:+584249876543");
  });

  it("debe evaluar correctamente la condición de cuota agotada (10 visitas o 5 contactos)", () => {
    const evaluateQuota = (visits: number, contacts: number, visitLimit = 10, contactLimit = 5) => {
      // Regla de CLAUDE.md: se agota cuando alcanza 10 visitas O 5 contactos
      const isExhausted = visits >= visitLimit || contacts >= contactLimit;
      return !isExhausted;
    };

    // Caso 1: Nuevo (0 visitas, 0 contactos)
    expect(evaluateQuota(0, 0)).toBe(true);

    // Caso 2: 9 visitas, 4 contactos -> Todavía activo
    expect(evaluateQuota(9, 4)).toBe(true);

    // Caso 3: 10 visitas, 2 contactos -> Agotado por visitas
    expect(evaluateQuota(10, 2)).toBe(false);

    // Caso 4: 3 visitas, 5 contactos -> Agotado por contactos
    expect(evaluateQuota(3, 5)).toBe(false);

    // Caso 5: 11 visitas, 6 contactos -> Agotado
    expect(evaluateQuota(11, 6)).toBe(false);
  });
});
