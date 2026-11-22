import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: { id: "mock-id", rate: 918.76 }, error: null }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  })),
}));

describe("Fase: Pago Móvil y Tasa BCV Automática", () => {
  const rootDir = process.cwd();

  describe("1. Integridad de la Migración SQL", () => {
    const migrationFile = path.join(
      rootDir,
      "supabase",
      "migrations",
      "20261122130000_exchange_rates_and_payment_settings.sql"
    );

    it("el archivo de migración debe existir", () => {
      expect(fs.existsSync(migrationFile)).toBe(true);
    });

    it("debe definir la tabla exchange_rates con rate > 0 e índice único parcial para la tasa activa", () => {
      const content = fs.readFileSync(migrationFile, "utf-8");
      expect(content).toContain("create table if not exists public.exchange_rates");
      expect(content).toContain("rate numeric(18,4) not null check (rate > 0)");
      expect(content).toContain("create unique index if not exists exchange_rates_one_active_per_pair");
      expect(content).toContain("where is_active = true");
    });

    it("debe aplicar RLS restrictivo en exchange_rates (público solo lee la tasa activa)", () => {
      const content = fs.readFileSync(migrationFile, "utf-8");
      expect(content).toContain("alter table public.exchange_rates enable row level security;");
      expect(content).toContain("create policy \"Public read active exchange rate\"");
      expect(content).toContain("using (is_active = true or private.is_admin())");
    });

    it("debe definir payment_settings con banco, código 0105 y RLS para authenticated y admin", () => {
      const content = fs.readFileSync(migrationFile, "utf-8");
      expect(content).toContain("create table if not exists public.payment_settings");
      expect(content).toContain("bank_code text not null default '0105'");
      expect(content).toContain("alter table public.payment_settings enable row level security;");
      expect(content).toContain("create policy \"Authenticated read payment settings\"");
      expect(content).toContain("create policy \"Admins manage payment settings\"");
    });

    it("submit_manual_payment debe consultar la tasa activa en BD y calcular amount_bs en el servidor", () => {
      const content = fs.readFileSync(migrationFile, "utf-8");
      expect(content).toContain("create or replace function public.submit_manual_payment");
      expect(content).toContain("where currency_pair = 'USD_VES' and is_active = true");
      expect(content).toContain("No hay una tasa de cambio oficial activa en el sistema");
      expect(content).toContain("round((v_plan.price * v_active_rate.rate), 2)");
      expect(content).toContain("amount_usd,");
      expect(content).toContain("rate_used,");
      expect(content).toContain("amount_bs,");
      expect(content).toContain("rate_date");
    });
  });

  describe("2. Seguridad de la Ruta Cron /api/cron/actualizar-tasa", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("debe responder 401 si no hay CRON_SECRET configurado", async () => {
      delete process.env.CRON_SECRET;
      const { GET } = await import("@/app/api/cron/actualizar-tasa/route");

      const req = new NextRequest("http://localhost:3000/api/cron/actualizar-tasa", {
        method: "GET",
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("No configurado");
    });

    it("debe responder 401 si el header Authorization no coincide exactamente", async () => {
      process.env.CRON_SECRET = "mi_secreto_super_seguro_12345";
      const { GET } = await import("@/app/api/cron/actualizar-tasa/route");

      // Sin header
      const reqSinHeader = new NextRequest("http://localhost:3000/api/cron/actualizar-tasa", {
        method: "GET",
      });
      const resSinHeader = await GET(reqSinHeader);
      expect(resSinHeader.status).toBe(401);

      // Con header incorrecto
      const reqHeaderErroneo = new NextRequest("http://localhost:3000/api/cron/actualizar-tasa", {
        method: "GET",
        headers: {
          authorization: "Bearer clave_totalmente_falsa",
        },
      });
      const resHeaderErroneo = await GET(reqHeaderErroneo);
      expect(resHeaderErroneo.status).toBe(401);
    });

    it("vercel.json debe existir con la expresión de cron diario '0 11 * * *'", () => {
      const vercelJsonPath = path.join(rootDir, "vercel.json");
      expect(fs.existsSync(vercelJsonPath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(vercelJsonPath, "utf-8"));

      expect(content.crons).toBeTruthy();
      expect(content.crons[0].path).toBe("/api/cron/actualizar-tasa");
      expect(content.crons[0].schedule).toBe("0 11 * * *");
    });
  });

  describe("3. Configuración de Entorno y Documentación", () => {
    it(".env.example debe documentar COTIZAVE_API_KEY y CRON_SECRET sin valores", () => {
      const envExamplePath = path.join(rootDir, ".env.example");
      expect(fs.existsSync(envExamplePath)).toBe(true);
      const content = fs.readFileSync(envExamplePath, "utf-8");

      expect(content).toContain("COTIZAVE_API_KEY=");
      expect(content).toContain("CRON_SECRET=");
      // Verificar que no contengan valores reales en el archivo del repo
      expect(content).toMatch(/COTIZAVE_API_KEY=\s*$/m);
      expect(content).toMatch(/CRON_SECRET=\s*$/m);
    });
  });
});
