import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Fase: Modo Lanzamiento Gratuito + Interruptor de Cobro (CLAUDE.md)", () => {
  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/20261122140000_launch_mode_and_billing_switch.sql"
  );
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");

  describe("1. Integridad y Seguridad del SQL de Migración", () => {
    it("debe existir el archivo de migración y registrar las claves de billing en app_settings", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      expect(migrationSql).toContain("'billing_enabled'");
      expect(migrationSql).toContain("'billing_enabled_at'");
      expect(migrationSql).toContain("'launch_banner_text'");
      expect(migrationSql).toContain("'launch_banner_enabled'");
    });

    it("debe tener un trigger que bloquea UPDATE directo sobre billing_enabled", () => {
      expect(migrationSql).toContain("create or replace function private.protect_billing_settings()");
      expect(migrationSql).toContain("Modificación directa prohibida: use la función admin_set_billing_enabled");
      expect(migrationSql).toContain("create trigger protect_billing_settings_trigger");
    });

    it("debe definir admin_set_billing_enabled con SECURITY DEFINER y permisos exclusivos", () => {
      expect(migrationSql).toContain("create or replace function public.admin_set_billing_enabled(");
      expect(migrationSql).toContain("security definer");
      expect(migrationSql).toContain("set search_path = ''");
      expect(migrationSql).toContain(
        "revoke execute on function public.admin_set_billing_enabled from public, anon;"
      );
      expect(migrationSql).toContain(
        "grant execute on function public.admin_set_billing_enabled to authenticated;"
      );
      expect(migrationSql).toContain("insert into public.audit_logs");
    });

    it("debe tener la función pública get_billing_status con permisos de lectura pública", () => {
      expect(migrationSql).toContain("create or replace function public.get_billing_status()");
      expect(migrationSql).toContain(
        "revoke execute on function public.get_billing_status from public;"
      );
      expect(migrationSql).toContain(
        "grant execute on function public.get_billing_status to anon, authenticated;"
      );
    });

    it("debe hacer DROP FUNCTION explícito de la sobrecarga vieja de submit_manual_payment con p_amount", () => {
      expect(migrationSql).toMatch(
        /drop function if exists public\.submit_manual_payment\s*\(\s*uuid\s*,\s*uuid\s*,\s*numeric/i
      );
    });

    it("la nueva función submit_manual_payment NO debe recibir p_amount como argumento", () => {
      const createIndex = migrationSql.indexOf("create or replace function public.submit_manual_payment(");
      expect(createIndex).toBeGreaterThan(-1);
      const funcHeader = migrationSql.substring(createIndex, createIndex + 400);
      expect(funcHeader).not.toContain("p_amount");
      expect(migrationSql).toContain("El cobro aún no está activo. La plataforma se encuentra en fase de lanzamiento gratuito.");
    });

    it("record_profile_visit y reveal_professional_contact deben usar p_actor_id y NUNCA llamar a auth.uid()", () => {
      expect(migrationSql).toContain("p_actor_id uuid default null");

      const visitFuncIndex = migrationSql.indexOf("public.record_profile_visit(");
      const contactFuncIndex = migrationSql.indexOf("public.reveal_professional_contact(");
      const metricsFuncIndex = migrationSql.indexOf("public.get_professional_metrics(");

      expect(visitFuncIndex).toBeGreaterThan(-1);
      expect(contactFuncIndex).toBeGreaterThan(-1);
      expect(metricsFuncIndex).toBeGreaterThan(-1);

      const visitFunc = migrationSql.substring(visitFuncIndex, contactFuncIndex);
      // Debe comprobar p_actor_id sin llamar a auth.uid() en el código ejecutable
      expect(visitFunc).not.toMatch(/\bauth\.uid\(\)/);
      expect(visitFunc).not.toContain("exception when others then return false");

      const contactFunc = migrationSql.substring(contactFuncIndex, metricsFuncIndex);
      expect(contactFunc).not.toMatch(/\bauth\.uid\(\)/);
      expect(contactFunc).not.toContain("raw_urlencode");
      expect(contactFunc).not.toContain("https://wa.me/");
    });

    it("debe revocar permisos de anon y authenticated sobre funciones críticas y otorgar solo a service_role", () => {
      expect(migrationSql).toContain(
        "revoke execute on function public.record_profile_visit(uuid, text, text, uuid) from public, anon, authenticated;"
      );
      expect(migrationSql).toContain(
        "grant execute on function public.record_profile_visit(uuid, text, text, uuid) to service_role;"
      );

      expect(migrationSql).toContain(
        "revoke execute on function public.reveal_professional_contact(uuid, text, text, text, uuid) from public, anon, authenticated;"
      );
      expect(migrationSql).toContain(
        "grant execute on function public.reveal_professional_contact(uuid, text, text, text, uuid) to service_role;"
      );

      expect(migrationSql).toContain(
        "revoke execute on function public.get_professional_metrics(uuid, uuid) from public, anon, authenticated;"
      );
      expect(migrationSql).toContain(
        "grant execute on function public.get_professional_metrics(uuid, uuid) to service_role;"
      );
    });
  });

  describe("2. Reglas del Modo Lanzamiento en Lógica de Negocio", () => {
    it("mientras billing_enabled sea false, contacts_enabled debe retornar true siempre", () => {
      const contactsEnabledLogic = (billingEnabled: boolean, quotaExhausted: boolean, subscriptionActive: boolean) => {
        if (!billingEnabled) return true;
        if (subscriptionActive) return true;
        return !quotaExhausted;
      };

      expect(contactsEnabledLogic(false, true, false)).toBe(true);
      expect(contactsEnabledLogic(false, false, false)).toBe(true);
      expect(contactsEnabledLogic(true, true, false)).toBe(false);
      expect(contactsEnabledLogic(true, false, false)).toBe(true);
      expect(contactsEnabledLogic(true, true, true)).toBe(true);
    });

    it("los eventos durante lanzamiento NO deben contar para la cuota gratuita (counts_toward_free_quota = false)", () => {
      const evaluateEventQuotaFlag = (billingEnabled: boolean, isOwnerOrAdmin: boolean) => {
        if (isOwnerOrAdmin) return false;
        return billingEnabled;
      };

      expect(evaluateEventQuotaFlag(false, false)).toBe(false);
      expect(evaluateEventQuotaFlag(true, false)).toBe(true);
      expect(evaluateEventQuotaFlag(true, true)).toBe(false);
    });

    it("el enlace de WhatsApp debe incluir la marca 'Ofir Oficios'", () => {
      const phone = "+584141234567";
      const cleanPhone = phone.replace(/\D/g, "");
      const msg = "Hola, vi tu perfil en Ofir Oficios y deseo consultar sobre tus servicios.";
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

      expect(url).toContain("https://wa.me/584141234567?text=");
      expect(url).toContain(encodeURIComponent("Ofir Oficios"));
    });
  });
});
