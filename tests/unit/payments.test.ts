import { describe, it, expect } from "vitest";

describe("Fase 5: Reglas de Negocio de Pagos y Suscripciones (CLAUDE.md)", () => {
  it("la suscripción solo es válida si status === 'active' Y ends_at > now()", () => {
    const isSubscriptionActive = (status: string, endsAt: string | null) => {
      // Regla de CLAUDE.md: "Siempre comprobar ends_at > now(); nunca confiar solo en status = 'active'"
      if (status !== "active" || !endsAt) return false;
      return new Date(endsAt).getTime() > Date.now();
    };

    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(); // +15 días
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(); // -2 días

    // Caso 1: Status active con fecha futura -> Válida
    expect(isSubscriptionActive("active", futureDate)).toBe(true);

    // Caso 2: Status active pero vencida por fecha -> Inválida (bloqueada)
    expect(isSubscriptionActive("active", pastDate)).toBe(false);

    // Caso 3: Status pending con fecha futura -> Inválida
    expect(isSubscriptionActive("pending", futureDate)).toBe(false);

    // Caso 4: Status cancelled -> Inválida
    expect(isSubscriptionActive("cancelled", futureDate)).toBe(false);
  });

  it("debe calcular correctamente la extensión de suscripciones activas", () => {
    const calculateNewDates = (
      currentActiveEndsAt: string | null,
      planDurationDays: number
    ) => {
      const now = Date.now();
      const hasActive =
        currentActiveEndsAt && new Date(currentActiveEndsAt).getTime() > now;

      const baseTime = hasActive ? new Date(currentActiveEndsAt!).getTime() : now;
      const newEndsAt = new Date(baseTime + planDurationDays * 24 * 60 * 60 * 1000);

      return {
        startsAt: hasActive ? new Date(now) : new Date(now),
        endsAt: newEndsAt,
      };
    };

    // Caso A: Sin suscripción previa (plan de 30 días)
    const newDates = calculateNewDates(null, 30);
    const diffDaysNew = Math.round(
      (newDates.endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDaysNew).toBe(30);

    // Caso B: Con suscripción previa a la que le quedaban 10 días
    const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const extendedDates = calculateNewDates(tenDaysFromNow, 30);
    const diffDaysExtended = Math.round(
      (extendedDates.endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDaysExtended).toBe(40); // 10 días restantes + 30 días adicionales
  });

  it("debe validar tipos MIME y límites de tamaño de comprobantes", () => {
    const ALLOWED_MIMES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

    const validateFile = (mime: string, sizeBytes: number) => {
      if (!ALLOWED_MIMES.includes(mime)) return { valid: false, error: "MIME inválido" };
      if (sizeBytes > MAX_SIZE) return { valid: false, error: "Excede 5MB" };
      return { valid: true };
    };

    expect(validateFile("image/png", 1024 * 500).valid).toBe(true);
    expect(validateFile("image/jpeg", 1024 * 1024 * 2).valid).toBe(true);
    expect(validateFile("application/pdf", 1024 * 1024 * 4).valid).toBe(true);
    expect(validateFile("application/x-msdownload", 1024).valid).toBe(false);
    expect(validateFile("image/png", 6 * 1024 * 1024).valid).toBe(false);
  });
});
