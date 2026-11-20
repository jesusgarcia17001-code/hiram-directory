"use client";

import React, { useState, useTransition } from "react";
import { reviewPaymentAction } from "@/features/payments/actions";

interface AdminPaymentActionsProps {
  paymentId: string;
  professionalName: string;
  amount: number;
}

export function AdminPaymentActions({
  paymentId,
  professionalName,
  amount,
}: AdminPaymentActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(
    null
  );

  const handleApprove = () => {
    if (
      !confirm(
        `¿Confirmas que verificaste el pago de $${amount} USD para "${professionalName}" y deseas activar su suscripción por 30 días?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("payment_id", paymentId);
      formData.append("decision", "approved");

      const res = await reviewPaymentAction(formData);
      setFeedback({
        success: res.success,
        message: res.message || "",
      });
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectReason.trim().length < 3) {
      alert("Por favor ingresa un motivo para el rechazo.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("payment_id", paymentId);
      formData.append("decision", "rejected");
      formData.append("rejection_reason", rejectReason.trim());

      const res = await reviewPaymentAction(formData);
      setShowRejectModal(false);
      setFeedback({
        success: res.success,
        message: res.message || "",
      });
    });
  };

  return (
    <div className="flex items-center gap-2">
      {feedback && (
        <span
          className={`text-[11px] font-semibold ${
            feedback.success ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {feedback.message}
        </span>
      )}

      {!feedback?.success && (
        <>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {isPending ? "..." : "✓ Aprobar"}
          </button>

          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            disabled={isPending}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            ✕ Rechazar
          </button>
        </>
      )}

      {/* Modal de Rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-left">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Rechazar Pago de {professionalName}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Indica la razón por la que no se pudo validar el pago. El profesional podrá ver este mensaje en su panel.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo de Rechazo
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: Número de referencia no encontrado en la cuenta receptora o monto incorrecto."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                >
                  {isPending ? "Rechazando..." : "Confirmar Rechazo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
