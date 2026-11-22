import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { brand } from "@/config/brand";
import {
  getActivePlans,
  getProfessionalSubscriptionInfo,
  getActiveExchangeRate,
  getPaymentSettings,
} from "@/services/payments";
import { getBillingStatus } from "@/services/billing";
import { PaymentForm } from "@/features/payments/PaymentForm";
import { ReceiptViewerButton } from "@/components/payments/ReceiptViewerModal";

export default async function PanelSuscripcionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: professional } = await supabase
    .from("professionals")
    .select("id, business_name, status")
    .eq("owner_id", user!.id)
    .maybeSingle();

  if (!professional) {
    return (
      <div className="bg-brand-surface p-8 rounded-2xl border border-dashed border-brand-primary/40 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-surface-soft text-brand-primary flex items-center justify-center text-3xl">
          🛠️
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-lg font-bold text-brand-text-primary">
            Primero crea tu perfil profesional
          </h2>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Para contratar planes y activar suscripciones, primero debes completar la ficha técnica de tus servicios.
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
    );
  }

  const [plans, info, activeRate, paymentSettings, billingStatus] = await Promise.all([
    getActivePlans(),
    getProfessionalSubscriptionInfo(professional.id),
    getActiveExchangeRate(),
    getPaymentSettings(),
    getBillingStatus(),
  ]);

  const { subscription, payments } = info;
  const isCurrentlyActive = subscription?.isCurrentlyActive;
  const isBillingActive = billingStatus.billingEnabled;

  // Calcular días restantes si la suscripción está activa
  let daysRemaining = 0;
  if (isCurrentlyActive && subscription?.ends_at) {
    const diffMs = new Date(subscription.ends_at).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <nav className="text-xs text-brand-text-muted flex items-center gap-1.5 mb-2">
          <Link href="/panel" className="hover:text-brand-primary">
            Panel
          </Link>
          <span>/</span>
          <span className="text-brand-text-primary font-medium">
            Planes y Suscripción
          </span>
        </nav>
        <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">
          Gestión de Planes y Suscripción
        </h1>
        <p className="text-sm text-brand-text-muted mt-1">
          Activa o renueva tu suscripción para recibir contactos ilimitados y posicionar tu perfil en {brand.name}.
        </p>
      </div>

      {/* Tarjeta de Estado Actual */}
      <div className="p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider block">
              Estado de tu Suscripción
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-brand-text-primary">
                {isCurrentlyActive
                  ? "Suscripción Activa"
                  : !isBillingActive
                  ? "Modo Lanzamiento Gratuito"
                  : "Plan Gratuito"}
              </h2>
              {isCurrentlyActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Vigente ({daysRemaining} {daysRemaining === 1 ? "día restante" : "días restantes"})
                </span>
              ) : !isBillingActive ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  100% Gratuito durante lanzamiento
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Sujeto a cuota gratuita
                </span>
              )}
            </div>
            {!isBillingActive && !isCurrentlyActive ? (
              <p className="text-xs text-brand-text-muted">
                Durante el lanzamiento oficial de {brand.name}, todos los contactos y beneficios son gratuitos. No requieres pagar nada.
              </p>
            ) : isCurrentlyActive && subscription?.ends_at ? (
              <p className="text-xs text-brand-text-muted">
                Tu plan actual vencerá el{" "}
                <span className="font-semibold text-brand-text-primary">
                  {new Date(subscription.ends_at).toLocaleDateString("es-VE", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                .
              </p>
            ) : null}
          </div>

          <div className="text-left sm:text-right">
            <Link
              href="/panel"
              className="text-xs font-semibold text-brand-primary hover:underline"
            >
              ← Volver al resumen de métricas
            </Link>
          </div>
        </div>
      </div>

      {/* Formulario de Reporte de Pago o Aviso de Lanzamiento */}
      {isBillingActive ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-brand-surface border border-brand-border shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-brand-text-primary">
              Reportar Pago Manual
            </h2>
            <p className="text-xs text-brand-text-muted mt-1">
              Realiza tu pago móvil o transferencia y adjunta la captura para que un administrador active tu cuenta.
            </p>
          </div>

          <PaymentForm
            professionalId={professional.id}
            plans={plans}
            activeRate={activeRate}
            paymentSettings={paymentSettings}
          />
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-3xl shadow-sm">
            🎉
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <h2 className="text-xl font-bold text-brand-text-primary">
              ¡Plataforma en Fase de Lanzamiento Gratuita!
            </h2>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              Durante esta etapa de inicio, todos los profesionales aprobados tienen visibilidad completa y botones de contacto ilimitados (WhatsApp y llamadas) sin costo alguno.
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 py-2 px-3 rounded-xl inline-block mt-2">
              💡 El módulo de pagos se encuentra temporalmente deshabilitado. No necesitas realizar ningún depósito ni transferencia.
            </p>
          </div>
        </div>
      )}

      {/* Historial de Pagos Reportados */}
      <div className="p-6 sm:p-8 rounded-2xl bg-brand-surface border border-brand-border shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-brand-text-primary">
            Historial de Pagos y Comprobantes
          </h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Registro de todos tus comprobantes reportados y su estado de revisión por administración.
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-sm text-brand-text-muted border border-dashed border-brand-border rounded-xl">
            Aún no has reportado ningún pago.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-surface-muted border-b border-brand-border text-brand-text-muted uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4">Monto</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-brand-text-muted">
                      {new Date(p.created_at).toLocaleDateString("es-VE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-brand-text-primary capitalize">
                      {p.payment_method.replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-brand-text-primary">
                      {p.reference_number || "—"}
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-text-primary">
                      ${p.amount} {p.currency}
                      {p.amount_bs ? (
                        <span className="block text-[11px] font-normal text-brand-text-muted">
                          (Bs {Number(p.amount_bs).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-4">
                      {p.status === "approved" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Aprobado
                        </span>
                      )}
                      {p.status === "pending" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ⏳ En Revisión
                        </span>
                      )}
                      {p.status === "rejected" && (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            ✕ Rechazado
                          </span>
                          {p.rejection_reason && (
                            <p className="text-[10px] text-red-600 max-w-xs">
                              Motivo: {p.rejection_reason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.receipt?.storage_path ? (
                        <ReceiptViewerButton
                          storagePath={p.receipt.storage_path}
                          buttonLabel="Ver"
                          variant="subtle"
                        />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
