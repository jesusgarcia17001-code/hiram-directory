"use client";

import React, { useState, useTransition } from "react";
import { submitPaymentAction, SubmitPaymentResult } from "@/features/payments/actions";
import { PlanItem } from "@/services/payments";

interface PaymentFormProps {
  professionalId: string;
  plans: PlanItem[];
}

export function PaymentForm({ professionalId, plans }: PaymentFormProps) {
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

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

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
    formData.append("amount", (selectedPlan?.price || 5).toString());
    formData.append("payment_method", paymentMethod);
    formData.append("reference_number", reference.trim());
    formData.append("receipt_file", selectedFile);

    startTransition(async () => {
      const res = await submitPaymentAction(null, formData);
      setResult(res);
      if (res.success) {
        setReference("");
        setSelectedFile(null);
        // Reset file input
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

      {/* 2. Datos Bancarios Oficiales */}
      <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Realiza tu pago en Bolívares (Tasa Oficial BCV)
          </span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            Cuentas Oficiales
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-lg space-y-1">
            <span className="font-bold text-blue-400 block">📱 Pago Móvil</span>
            <p><strong>Banco:</strong> Banesco (0134)</p>
            <p><strong>Teléfono:</strong> 0414-8001234</p>
            <p><strong>C.I. / RIF:</strong> J-50123456-7</p>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-lg space-y-1">
            <span className="font-bold text-emerald-400 block">🏦 Transferencia Bancaria</span>
            <p><strong>Banco:</strong> Banesco Banco Universal</p>
            <p><strong>Cuenta:</strong> 0134-0000-00-0000000000</p>
            <p><strong>Titular:</strong> Directorio HIRAM C.A.</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          💡 <em>Calcula el monto al cambio oficial del BCV del día correspondiente al plan seleccionado (${selectedPlan?.price || 5} USD).</em>
        </p>
      </div>

      {/* 3. Reportar los datos del pago */}
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
              <option value="deposito_dolares">Depósito en Dólares / Divisas</option>
              <option value="efectivo">Efectivo / Entrega Directa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text-muted mb-1">
              Número de Referencia Bancaria
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
            Captura o Comprobante de Pago (JPG, PNG, PDF - Máx 5 MB)
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
            `Reportar Pago de $${selectedPlan?.price || 5} USD →`
          )}
        </button>
      </div>
    </form>
  );
}
