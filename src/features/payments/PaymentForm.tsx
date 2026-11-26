"use client";

import React, { useState, useTransition } from "react";
import { submitPaymentAction, SubmitPaymentResult } from "@/features/payments/actions";
import { PlanItem, PaymentSettingsItem, ActiveExchangeRate } from "@/services/payments";

interface PaymentFormProps {
  professionalId: string;
  plans: PlanItem[];
  paymentSettings: PaymentSettingsItem | null;
  activeRate: ActiveExchangeRate | null;
}

export function PaymentForm({
  professionalId,
  plans,
  paymentSettings,
  activeRate,
}: PaymentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmitPaymentResult | null>(null);

  // Filtrar solo planes pagos (precio > 0)
  const paidPlans = plans.filter((p) => p.price > 0);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    paidPlans[0]?.id || ""
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("pago_movil");
  const [reference, setReference] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const planPriceUsd = selectedPlan?.price || 0;
  const rateValue = activeRate?.rate || 0;
  const amountBs = rateValue > 0 ? Number((planPriceUsd * rateValue).toFixed(2)) : 0;

  const handleCopy = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    if (!activeRate || rateValue <= 0) {
      setResult({
        success: false,
        message: "No hay una tasa de cambio activa en este momento. Por favor espera unos minutos o contacta a soporte.",
      });
      return;
    }

    if (!selectedPlanId) {
      setResult({
        success: false,
        message: "Por favor selecciona un plan a contratar.",
      });
      return;
    }

    if (!reference.trim()) {
      setResult({
        success: false,
        message: "Por favor ingresa el número de referencia del comprobante.",
      });
      return;
    }

    if (!selectedFile) {
      setResult({
        success: false,
        message: "Debes adjuntar la captura o comprobante de tu pago.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("professional_id", professionalId);
    formData.append("plan_id", selectedPlanId);
    formData.append("amount", planPriceUsd.toString());
    formData.append("payment_method", paymentMethod);
    formData.append("reference_number", reference.trim());
    formData.append("receipt_file", selectedFile);

    startTransition(async () => {
      const res = await submitPaymentAction(null, formData);
      setResult(res);
      if (res.success) {
        setReference("");
        setSelectedFile(null);
        const fileInput = document.getElementById("receipt_file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensajes de resultado */}
      {result && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${
            result.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span className="text-lg">{result.success ? "✅" : "⚠️"}</span>
          <div>
            <p className="font-semibold">{result.message}</p>
          </div>
        </div>
      )}

      {/* 1. Selección de Plan */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-brand-text-primary">
          1. Selecciona el Plan que deseas contratar
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paidPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "border-brand-primary bg-brand-surface-soft ring-2 ring-brand-primary shadow-xs"
                    : "border-brand-border bg-brand-surface hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-text-primary">
                    Plan {plan.name}
                  </span>
                  <span className="text-base font-extrabold text-brand-primary">
                    ${plan.price}{" "}
                    <span className="text-xs font-normal text-brand-text-muted">
                      / mes
                    </span>
                  </span>
                </div>
                <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                  {plan.description || "Desbloqueo de contactos y métricas avanzadas."}
                </p>
                <div className="mt-3 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <span>✓</span> Contactos ilimitados por {plan.duration_days} días
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Resumen de Monto a Pagar y Tasa BCV */}
      <div className="p-5 rounded-2xl bg-brand-surface-soft border border-brand-primary/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-primary/10 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-text-muted block">
              Monto a Transferir en Bolívares
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-brand-text-primary font-mono">
                {amountBs > 0 ? `Bs ${amountBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
              </span>
              <span className="text-xs font-bold text-brand-text-muted">
                (${planPriceUsd} USD)
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            {activeRate ? (
              <div className="space-y-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Tasa del día: {activeRate.rate.toFixed(2)} Bs
                </span>
                <p className="text-[10px] text-brand-text-muted">
                  Fuente: {activeRate.source === "manual" ? "Oficial (Manual)" : "BCV (CotizaVE)"} ·{" "}
                  {new Date(activeRate.source_updated_at).toLocaleDateString("es-VE")}
                </p>
              </div>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                ⚠️ Tasa no disponible
              </span>
            )}
          </div>
        </div>

        <p className="text-[11px] text-brand-text-muted leading-relaxed">
          ℹ️ <strong>Aviso:</strong> El monto en Bs se calcula con la tasa BCV vigente al momento de reportar el pago.
        </p>
      </div>

      {/* 3. Datos Bancarios Oficiales de Pago Móvil con botón Copiar */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Datos para realizar el Pago Móvil
          </span>
          <span className="text-[10px] bg-slate-800 px-2.5 py-0.5 rounded text-slate-300 font-semibold">
            Cuenta Receptora Oficial
          </span>
        </div>

        {paymentSettings && paymentSettings.phone ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Banco */}
            <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Banco</span>
                <p className="font-semibold text-white">
                  {paymentSettings.bank_name}{" "}
                  <span className="font-mono text-amber-400">({paymentSettings.bank_code})</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(paymentSettings.bank_code, "bank")}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
              >
                {copiedField === "bank" ? "Copiado ✓" : "Copiar"}
              </button>
            </div>

            {/* Teléfono */}
            <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Teléfono</span>
                <p className="font-mono font-semibold text-white">{paymentSettings.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(paymentSettings.phone, "phone")}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
              >
                {copiedField === "phone" ? "Copiado ✓" : "Copiar"}
              </button>
            </div>

            {/* Documento */}
            <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Cédula / RIF</span>
                <p className="font-mono font-semibold text-white">
                  {paymentSettings.id_type}-{paymentSettings.id_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(`${paymentSettings.id_type}${paymentSettings.id_number}`, "doc")
                }
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
              >
                {copiedField === "doc" ? "Copiado ✓" : "Copiar"}
              </button>
            </div>

            {/* Titular */}
            <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Titular</span>
                <p className="font-semibold text-white truncate max-w-[140px]">
                  {paymentSettings.account_holder}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(paymentSettings.account_holder, "holder")}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
              >
                {copiedField === "holder" ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-800/50 rounded-xl text-center text-xs text-slate-400">
            Los datos de Pago Móvil están en proceso de configuración por administración.
          </div>
        )}

        {paymentSettings?.instructions && (
          <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            💡 {paymentSettings.instructions}
          </p>
        )}
      </div>

      {/* 4. Reportar los datos del pago */}
      <div className="space-y-4 pt-2">
        <label className="block text-sm font-bold text-brand-text-primary">
          3. Reporta los datos de tu comprobante
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-text-muted mb-1">
              Método de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none"
            >
              <option value="pago_movil">Pago Móvil</option>
              <option value="transferencia">Transferencia Bancaria Nacional</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted mb-1">
              Número de Referencia Bancaria *
            </label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: 12345678"
              className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Carga del comprobante */}
        <div>
          <label className="block text-xs font-semibold text-brand-text-muted mb-1">
            Captura o Comprobante de Pago (JPG, PNG, PDF - Máx 5 MB) *
          </label>
          <input
            id="receipt_file"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-xl file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary-hover cursor-pointer"
          />
          <p className="text-[11px] text-brand-text-muted mt-1">
            🔒 El comprobante se almacena de forma privada y encriptada en el servidor. Solo tú y el equipo de administración tienen acceso a él.
          </p>
        </div>
      </div>

      <div className="pt-2">
        {!activeRate || rateValue <= 0 ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs space-y-1">
            <p className="font-bold">⚠️ Pagos temporalmente en pausa</p>
            <p>
              Estamos sincronizando la tasa de cambio oficial del día. En breves minutos podrás reportar tu pago con el monto en Bolívares actualizado.
            </p>
          </div>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold bg-brand-primary text-white shadow-sm hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Enviando comprobante...
              </span>
            ) : (
              `Reportar Pago por Bs ${amountBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </button>
        )}
      </div>
    </form>
  );
}
