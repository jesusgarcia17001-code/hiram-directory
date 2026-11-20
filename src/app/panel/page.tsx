import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/config/brand";
import { getProfessionalMetrics } from "@/services/metrics";

export default async function PanelDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Consultar si el usuario ya tiene un perfil profesional registrado
  const { data: professional } = await supabase
    .from("professionals")
    .select(
      "id, business_name, slug, provider_type, status, locality_id, experience_years, created_at"
    )
    .eq("owner_id", user!.id)
    .maybeSingle();

  // Consultar métricas en tiempo real si el profesional existe
  const metrics = professional ? await getProfessionalMetrics(professional.id) : null;

  const quota = metrics?.quota;
  const stats = metrics?.stats;
  const subscription = metrics?.subscription;

  const visitPercent = quota
    ? Math.min(100, Math.round((quota.visits / quota.visit_limit) * 100))
    : 0;

  const contactPercent = quota
    ? Math.min(100, Math.round((quota.contacts / quota.contact_limit) * 100))
    : 0;

  const isContactsEnabled = quota?.is_contacts_enabled ?? true;

  return (
    <div className="space-y-6">
      {/* Encabezado del Dashboard */}
      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs">
        <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">
          Hola, {user?.user_metadata?.full_name || "Colega"} 👋
        </h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Bienvenido a tu panel de administración en {brand.name}.
        </p>
      </div>

      {/* Si AÚN NO ha creado su perfil profesional */}
      {!professional ? (
        <div className="bg-brand-surface p-8 rounded-2xl border border-dashed border-brand-primary/40 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-brand-primary flex items-center justify-center text-3xl">
            🛠️
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-brand-text-primary">
              Crea tu perfil de Técnico o Empresa
            </h2>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              Para comenzar a recibir contactos de clientes en Puerto La Cruz, Barcelona y todo Anzoátegui, configura los datos de tus servicios.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/panel/perfil"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-primary text-white shadow-sm hover:bg-brand-primary-hover transition-colors"
            >
              Completar mi perfil ahora →
            </Link>
          </div>
        </div>
      ) : (
        /* Si YA TIENE un perfil profesional creado */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta de Ficha Técnica */}
            <div className="md:col-span-2 bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-surface-muted text-brand-text-muted border border-brand-border">
                    {professional.provider_type === "company"
                      ? "🏢 Empresa / Taller"
                      : "👤 Técnico Independiente"}
                  </span>
                  <h2 className="text-xl font-bold text-brand-text-primary mt-2">
                    {professional.business_name}
                  </h2>
                  <p className="text-xs text-brand-text-muted mt-0.5">
                    Identificador de perfil: <span className="font-mono">{professional.slug}</span>
                  </p>
                </div>

                {/* Estado de Aprobación */}
                <div>
                  {professional.status === "approved" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Activo y Aprobado
                    </span>
                  )}
                  {professional.status === "pending" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      En revisión por administración
                    </span>
                  )}
                  {professional.status === "rejected" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                      Requiere correcciones
                    </span>
                  )}
                  {professional.status === "suspended" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      Suspendido
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                <span className="text-xs text-brand-text-muted">
                  {professional.status === "pending"
                    ? "Te notificaremos por correo en cuanto un administrador verifique tus datos."
                    : "Tu perfil está visible para clientes en el directorio público."}
                </span>
                <Link
                  href="/panel/perfil"
                  className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline"
                >
                  Editar datos →
                </Link>
              </div>
            </div>

            {/* Tarjeta de Estado de Cuota / Suscripción */}
            <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                  Estado de Cuenta
                </h3>
                {subscription?.is_active ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Suscripción Activa
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Plan Gratuito
                  </span>
                )}
              </div>

              {/* Aviso si la cuota está agotada */}
              {!isContactsEnabled && !subscription?.is_active ? (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-1.5">
                  <p className="text-xs font-bold text-red-900 flex items-center gap-1">
                    <span>⛔</span> Contactos Bloqueados
                  </p>
                  <p className="text-[11px] text-red-700 leading-relaxed">
                    Has alcanzado el límite de tu cuota gratuita. Contrata un plan para desbloquear tus números de WhatsApp y llamadas.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <span>🟢</span> Contactos Habilitados
                  </p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    {subscription?.is_active
                      ? "Sin límites de contactos activos."
                      : "Tus clientes pueden contactarte por WhatsApp o llamada."}
                  </p>
                </div>
              )}

              {/* Indicador de Negocio de CLAUDE.md */}
              <p className="text-[11px] text-brand-text-muted leading-relaxed">
                💡 <em>Nota: Las visitas y contactos son indicadores de interés en tu servicio, no garantías de contratación de clientes.</em>
              </p>
            </div>
          </div>

          {/* Sección de Métricas y Consumo de Cuota (Fase 4) */}
          {quota && (
            <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  Consumo de Cuota Gratuita (Permanente y Acumulada)
                </h3>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  La cuota inicial se calcula sobre visitantes únicos desde la creación del perfil y no se reinicia mensualmente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Barra de Visitas Únicas */}
                <div className="space-y-2 p-4 rounded-xl bg-brand-surface-muted border border-brand-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-brand-text-primary flex items-center gap-1.5">
                      <span>👁️</span> Visitas Únicas al Perfil
                    </span>
                    <span className="font-bold font-mono text-brand-text-primary">
                      {quota.visits} / {quota.visit_limit}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        visitPercent >= 100
                          ? "bg-red-500"
                          : visitPercent >= 80
                          ? "bg-amber-500"
                          : "bg-brand-primary"
                      }`}
                      style={{ width: `${visitPercent}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-brand-text-muted">
                    {quota.visit_limit - quota.visits > 0
                      ? `Te quedan ${quota.visit_limit - quota.visits} visitas únicas antes del límite.`
                      : "Límite de visitas alcanzado."}
                  </p>
                </div>

                {/* Barra de Contactos Únicos */}
                <div className="space-y-2 p-4 rounded-xl bg-brand-surface-muted border border-brand-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-brand-text-primary flex items-center gap-1.5">
                      <span>📱</span> Contactos Únicos Recibidos
                    </span>
                    <span className="font-bold font-mono text-brand-text-primary">
                      {quota.contacts} / {quota.contact_limit}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        contactPercent >= 100
                          ? "bg-red-500"
                          : contactPercent >= 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${contactPercent}%` }}
                    ></div>
                  </div>

                  <p className="text-[11px] text-brand-text-muted">
                    {quota.contact_limit - quota.contacts > 0
                      ? `Te quedan ${quota.contact_limit - quota.contacts} contactos únicos antes del bloqueo.`
                      : "Límite de contactos alcanzado."}
                  </p>
                </div>
              </div>

              {/* Métricas adicionales de actividad */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-brand-border text-center">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                      Impresiones
                    </span>
                    <span className="text-xl font-bold text-slate-800 font-mono">
                      {stats.total_impressions}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                      Visitas Totales
                    </span>
                    <span className="text-xl font-bold text-slate-800 font-mono">
                      {stats.total_visits}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-emerald-600 font-semibold block uppercase">
                      Clics WhatsApp
                    </span>
                    <span className="text-xl font-bold text-emerald-700 font-mono">
                      {stats.total_whatsapp}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-blue-600 font-semibold block uppercase">
                      Clics Llamadas
                    </span>
                    <span className="text-xl font-bold text-blue-700 font-mono">
                      {stats.total_calls}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
