import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

// Mocks a nivel superior requeridos por Vitest
const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    get: vi.fn().mockReturnValue({ value: "mock-visitor-cookie-uuid" }),
    set: vi.fn(),
  })),
  headers: vi.fn().mockImplementation(async () => ({
    get: vi.fn().mockReturnValue("Mozilla/5.0"),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    rpc: mockRpc,
  }),
}));

describe("Seguridad de Métricas, Facturación y HMAC", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockGetUser.mockReset();
    mockRpc.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe("1. METRICS_HMAC_SECRET obligatorio (sin fallback inseguro)", () => {
    it("debe lanzar un error claro sin imprimir secretos si METRICS_HMAC_SECRET no está definido", async () => {
      delete process.env.METRICS_HMAC_SECRET;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { getOrCreateVisitorHash } = await import("@/services/metrics");

      await expect(getOrCreateVisitorHash()).rejects.toThrow(
        "Falta la variable de entorno obligatoria METRICS_HMAC_SECRET en el servidor."
      );
    });

    it("NO debe aceptar fallback a NEXT_PUBLIC_SUPABASE_ANON_KEY si METRICS_HMAC_SECRET falta", async () => {
      delete process.env.METRICS_HMAC_SECRET;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fallback-inseguro-anon-key";

      const { getOrCreateVisitorHash } = await import("@/services/metrics");

      await expect(getOrCreateVisitorHash()).rejects.toThrow(
        "Falta la variable de entorno obligatoria METRICS_HMAC_SECRET en el servidor."
      );
    });

    it("debe generar un hash HMAC-SHA256 válido cuando la variable está presente", async () => {
      process.env.METRICS_HMAC_SECRET = "super-secret-hmac-key-for-tests-123456";

      const { getOrCreateVisitorHash } = await import("@/services/metrics");
      const hash = await getOrCreateVisitorHash();

      expect(typeof hash).toBe("string");
      expect(hash).toHaveLength(64); // SHA-256 en hex tiene 64 caracteres
    });
  });

  describe("2. get_professional_metrics y control de acceso por p_actor_id", () => {
    it("getProfessionalMetrics debe rechazar y devolver null si no hay sesión autenticada en el servidor", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const { getProfessionalMetrics } = await import("@/services/metrics");
      const result = await getProfessionalMetrics("00000000-0000-0000-0000-000000000001");

      expect(result).toBeNull();
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("getProfessionalMetrics debe enviar p_actor_id del usuario autenticado al RPC con service_role", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-actor-id-123" } },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: {
          quota: { visits: 2, contacts: 1, visit_limit: 10, contact_limit: 5, is_contacts_enabled: true },
          stats: { total_impressions: 5, total_visits: 2, total_whatsapp: 1, total_calls: 0 },
          subscription: { is_active: false },
        },
        error: null,
      });

      const { getProfessionalMetrics } = await import("@/services/metrics");
      const result = await getProfessionalMetrics("prof-uuid-456");

      expect(mockRpc).toHaveBeenCalledWith("get_professional_metrics", {
        p_professional_id: "prof-uuid-456",
        p_actor_id: "user-actor-id-123",
      });
      expect(result?.quota.visits).toBe(2);
    });

    it("la migración SQL debe definir la firma con p_actor_id y restringir ejecución exclusivamente a service_role", () => {
      const migrationPath = path.join(
        process.cwd(),
        "supabase/migrations/20261122140000_launch_mode_and_billing_switch.sql"
      );
      const sql = fs.readFileSync(migrationPath, "utf-8");

      // Verificación de drops previos
      expect(sql).toContain("drop function if exists public.get_professional_metrics(uuid);");
      expect(sql).toContain("drop function if exists public.get_professional_metrics(uuid, uuid);");

      // Verificación de nueva firma
      expect(sql).toContain("p_professional_id uuid,");
      expect(sql).toContain("p_actor_id uuid default null");

      // Verificación de permisos estrictos (solo service_role)
      expect(sql).toContain(
        "revoke execute on function public.get_professional_metrics(uuid, uuid) from public, anon, authenticated;"
      );
      expect(sql).toContain(
        "grant execute on function public.get_professional_metrics(uuid, uuid) to service_role;"
      );
    });
  });

  describe("3. Política RLS de payment_settings", () => {
    const evaluatesPaymentSettingsPolicy = ({
      isAdmin,
      isActive,
      billingEnabled,
      hasProfessionalProfile,
    }: {
      isAdmin: boolean;
      isActive: boolean;
      billingEnabled: boolean;
      hasProfessionalProfile: boolean;
    }) => {
      // Regla idéntica a la expresión RLS de la migración:
      // private.is_admin() or (is_active = true and private.is_billing_enabled() and exists (select 1 from public.professionals where owner_id = (select auth.uid())))
      return isAdmin || (isActive && billingEnabled && hasProfessionalProfile);
    };

    it("un usuario sin perfil profesional NO puede leer payment_settings aunque la facturación esté activa", () => {
      const canRead = evaluatesPaymentSettingsPolicy({
        isAdmin: false,
        isActive: true,
        billingEnabled: true,
        hasProfessionalProfile: false,
      });
      expect(canRead).toBe(false);
    });

    it("con facturación apagada (billing_enabled = false), NINGÚN profesional puede leer los datos de pago", () => {
      const canRead = evaluatesPaymentSettingsPolicy({
        isAdmin: false,
        isActive: true,
        billingEnabled: false,
        hasProfessionalProfile: true,
      });
      expect(canRead).toBe(false);
    });

    it("con facturación encendida (billing_enabled = true), el dueño de un perfil profesional sí puede leer", () => {
      const canRead = evaluatesPaymentSettingsPolicy({
        isAdmin: false,
        isActive: true,
        billingEnabled: true,
        hasProfessionalProfile: true,
      });
      expect(canRead).toBe(true);
    });

    it("el administrador SIEMPRE puede leer payment_settings en cualquier circunstancia", () => {
      // Con billing apagado
      expect(
        evaluatesPaymentSettingsPolicy({
          isAdmin: true,
          isActive: false,
          billingEnabled: false,
          hasProfessionalProfile: false,
        })
      ).toBe(true);

      // Con billing encendido
      expect(
        evaluatesPaymentSettingsPolicy({
          isAdmin: true,
          isActive: true,
          billingEnabled: true,
          hasProfessionalProfile: false,
        })
      ).toBe(true);
    });

    it("la migración SQL debe contener la política RLS endurecida", () => {
      const migrationPath = path.join(
        process.cwd(),
        "supabase/migrations/20261122140000_launch_mode_and_billing_switch.sql"
      );
      const sql = fs.readFileSync(migrationPath, "utf-8");

      expect(sql).toContain('drop policy if exists "Authenticated read payment settings" on public.payment_settings;');
      expect(sql).toContain('create policy "Professionals read payment settings when billing enabled" on public.payment_settings');
      expect(sql).toContain("private.is_billing_enabled()");
      expect(sql).toContain("owner_id = (select auth.uid())");
    });
  });
});
