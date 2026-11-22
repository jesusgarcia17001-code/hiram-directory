import React from "react";
import Link from "next/link";
import {
  getActiveExchangeRate,
  getPaymentSettings,
  getPendingExchangeRates,
} from "@/services/payments";
import { PaymentSettingsForm } from "@/features/admin/components/PaymentSettingsForm";
import { ExchangeRateManager } from "@/features/admin/components/ExchangeRateManager";

export const dynamic = "force-dynamic";

export default async function AdminAjustesPagoPage() {
  const [activeRate, paymentSettings, pendingRates] = await Promise.all([
    getActiveExchangeRate(),
    getPaymentSettings(),
    getPendingExchangeRates(),
  ]);

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <nav className="text-xs text-brand-text-muted flex items-center gap-1.5 mb-1">
          <Link href="/admin" className="hover:text-brand-primary">
            Admin
          </Link>
          <span>/</span>
          <span className="text-brand-text-primary font-medium">Ajustes de Pago y Tasa</span>
        </nav>
        <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">
          Ajustes de Pago Móvil y Tasa BCV
        </h1>
        <p className="text-xs text-brand-text-muted mt-0.5">
          Configura la cuenta receptora de Pago Móvil y supervisa la tasa de cambio oficial aplicada a las suscripciones.
        </p>
      </div>

      {/* Sección 1: Tasa de Cambio y Control */}
      <section className="space-y-3">
        <div className="border-b border-brand-border pb-2">
          <h2 className="text-lg font-bold text-brand-text-primary">
            1. Control de Tasa Oficial (BCV / USD → VES)
          </h2>
          <p className="text-xs text-brand-text-muted">
            La tasa se sincroniza automáticamente cada día vía CotizaVE. Puedes fijar una tasa manual en cualquier momento.
          </p>
        </div>

        <ExchangeRateManager activeRate={activeRate} pendingRates={pendingRates} />
      </section>

      {/* Sección 2: Ajustes de Pago Móvil */}
      <section className="space-y-3 pt-4">
        <div className="border-b border-brand-border pb-2">
          <h2 className="text-lg font-bold text-brand-text-primary">
            2. Datos Bancarios de Pago Móvil
          </h2>
          <p className="text-xs text-brand-text-muted">
            Estos son los datos que los técnicos y empresas verán en su pantalla al momento de pagar su plan.
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <PaymentSettingsForm initialSettings={paymentSettings} />
        </div>
      </section>
    </div>
  );
}
