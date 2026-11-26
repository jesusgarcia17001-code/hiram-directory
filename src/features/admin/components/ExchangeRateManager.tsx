"use client";

import React, { useState, useActionState, useTransition } from "react";
import {
  setManualRateAction,
  revertToAutomatedRateAction,
  reviewPendingRateAction,
  ActionResult,
} from "../actions-payment-settings";
import { ActiveExchangeRate } from "@/services/payments";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface Props {
  activeRate: ActiveExchangeRate | null;
  pendingRates: any[];
}

export function ExchangeRateManager({ activeRate, pendingRates }: Props) {
  const [manualState, manualAction, isManualPending] = useActionState(setManualRateAction, null);
  const [isReverting, startRevertTransition] = useTransition();
  const [revertMsg, setRevertMsg] = useState<string | null>(null);

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  const handleRevert = () => {
    setRevertMsg(null);
    startRevertTransition(async () => {
      const res = await revertToAutomatedRateAction();
      setRevertMsg(res.message || (res.success ? "Tasa automática restaurada" : "Error al restaurar"));
    });
  };

  const handleReview = async (rateId: string, decision: "approved" | "rejected") => {
    setReviewingId(rateId);
    setReviewMsg(null);
    try {
      const res = await reviewPendingRateAction(rateId, decision);
      setReviewMsg(res.message || "Acción completada.");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Tarjeta de Tasa Activa Actual */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Tasa Activa Vigente (USD a VES)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-white font-mono">
                {activeRate ? activeRate.rate.toFixed(2) : "0.00"}
              </span>
              <span className="text-sm font-semibold text-slate-400">Bs / USD</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                activeRate?.source === "manual"
                  ? "bg-amber-950/80 text-amber-300 border-amber-800"
                  : "bg-emerald-950/80 text-emerald-300 border-emerald-800"
              }`}
            >
              Fuente: {activeRate?.source === "manual" ? "Fijada a mano (Manual)" : "CotizaVE (BCV)"}
            </span>

            {activeRate?.source === "manual" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevert}
                isLoading={isReverting}
                className="text-xs border-slate-700 text-slate-300 hover:text-white"
              >
                Volver a tasa automática
              </Button>
            )}
          </div>
        </div>

        {revertMsg && <Alert variant="info">{revertMsg}</Alert>}

        {activeRate ? (
          <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-900">
            <p>
              Fecha de la tasa:{" "}
              <span className="text-slate-200 font-medium">
                {new Date(activeRate.source_updated_at).toLocaleDateString("es-VE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-xs text-red-400 font-medium">
            ⚠️ No hay ninguna tasa activa configurada en el sistema. Los profesionales no podrán reportar pagos hasta que se active una.
          </p>
        )}

        {/* Alerta de tasa desactualizada (> 2 días) */}
        {activeRate?.is_outdated && (
          <div className="bg-amber-950/50 border border-amber-800/80 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-200">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold">Aviso: Tasa Desactualizada</p>
              <p className="text-amber-300/80">
                La última tasa registrada tiene más de 2 días de antigüedad. El cron actualizará automáticamente o puedes fijar una manualmente abajo.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Formulario de Override Manual */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Fijar Tasa Manual de Respaldo</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Si la API externa no está disponible o requieres ajustar la tasa de emergencia, ingrésala aquí. Tendrá prioridad sobre la automática.
          </p>
        </div>

        {manualState?.message && (
          <Alert variant={manualState.success ? "success" : "error"}>{manualState.message}</Alert>
        )}

        <form action={manualAction} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <Input
              label="Nueva Tasa en Bolívares (Bs / USD)"
              name="manual_rate"
              type="text"
              placeholder="Ej: 920.50"
              required
            />
          </div>
          <Button type="submit" isLoading={isManualPending} className="whitespace-nowrap">
            Fijar Tasa Manual
          </Button>
        </form>
      </div>

      {/* 3. Tasas Pendientes por Variación > 15% */}
      {pendingRates.length > 0 && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-amber-900/60 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="text-sm font-bold text-amber-300">
                Tasas Pendientes por Variación &gt; 15% ({pendingRates.length})
              </h3>
              <p className="text-xs text-slate-400">
                Estas tasas fueron retenidas por seguridad para que el administrador las valide antes de aplicarse a los pagos.
              </p>
            </div>
          </div>

          {reviewMsg && <Alert variant="info">{reviewMsg}</Alert>}

          <div className="space-y-3">
            {pendingRates.map((pr) => (
              <div
                key={pr.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <p className="text-white font-mono font-bold text-base">
                    {Number(pr.rate).toFixed(2)} Bs / USD
                  </p>
                  <p className="text-slate-400">
                    Variación detectada:{" "}
                    <span className="text-amber-300 font-bold">
                      +{Number(pr.variation_percentage || 0).toFixed(1)}%
                    </span>{" "}
                    respecto a la tasa activa previa.
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Detectada: {new Date(pr.created_at).toLocaleString("es-VE")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleReview(pr.id, "approved")}
                    isLoading={reviewingId === pr.id}
                    className="text-xs"
                  >
                    ✓ Aprobar y Activar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(pr.id, "rejected")}
                    isLoading={reviewingId === pr.id}
                    className="text-xs border-red-900 text-red-300 hover:bg-red-950"
                  >
                    ✕ Descartar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
