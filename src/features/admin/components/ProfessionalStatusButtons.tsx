"use client";

import React, { useActionState, useState } from "react";
import { updateProfessionalStatusAction, AdminActionState } from "../actions";

interface ProfessionalStatusButtonsProps {
  professionalId: string;
  currentStatus: string;
}

export function ProfessionalStatusButtons({
  professionalId,
  currentStatus,
}: ProfessionalStatusButtonsProps) {
  const [state, formAction, isPending] = useActionState<AdminActionState | null, FormData>(
    updateProfessionalStatusAction,
    null
  );

  const [showNoteInput, setShowNoteInput] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [note, setNote] = useState("");

  const handleOpenPrompt = (status: string) => {
    setTargetStatus(status);
    setShowNoteInput(true);
  };

  return (
    <div className="space-y-3">
      {state?.message && (
        <div
          className={`p-2.5 rounded-lg text-xs font-semibold ${
            state.success
              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
              : "bg-red-950/80 text-red-300 border border-red-800"
          }`}
        >
          {state.message}
        </div>
      )}

      {/* Si se abrió el formulario para añadir una nota de auditoría */}
      {showNoteInput ? (
        <form action={formAction} className="p-3 bg-slate-950 rounded-xl border border-slate-700 space-y-2.5">
          <input type="hidden" name="professional_id" value={professionalId} />
          <input type="hidden" name="status" value={targetStatus} />
          <input type="hidden" name="note" value={note} />

          <p className="text-xs font-bold text-white">
            Confirmar acción: Cambiar estado a{" "}
            <span
              className={
                targetStatus === "approved"
                  ? "text-emerald-400 font-extrabold uppercase"
                  : targetStatus === "rejected"
                  ? "text-red-400 font-extrabold uppercase"
                  : "text-amber-400 font-extrabold uppercase"
              }
            >
              {targetStatus}
            </span>
          </p>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Motivo o nota administrativa (opcional)..."
            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors ${
                targetStatus === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : targetStatus === "rejected"
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-amber-600 hover:bg-amber-500"
              } disabled:opacity-50`}
            >
              {isPending ? "Guardando..." : "Confirmar Cambio"}
            </button>
            <button
              type="button"
              onClick={() => setShowNoteInput(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        /* Botones de acción directa según estado actual */
        <div className="flex items-center flex-wrap gap-2">
          {currentStatus !== "approved" && (
            <button
              type="button"
              onClick={() => handleOpenPrompt("approved")}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs"
            >
              ✓ Aprobar y Publicar
            </button>
          )}

          {currentStatus === "pending" && (
            <button
              type="button"
              onClick={() => handleOpenPrompt("rejected")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950 text-red-300 border border-red-800 hover:bg-red-900 hover:text-white transition-colors"
            >
              ✕ Rechazar (Solicitar Correcciones)
            </button>
          )}

          {currentStatus === "approved" && (
            <button
              type="button"
              onClick={() => handleOpenPrompt("suspended")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 hover:text-white transition-colors"
            >
              ⏸ Suspender Perfil
            </button>
          )}

          {currentStatus === "suspended" && (
            <button
              type="button"
              onClick={() => handleOpenPrompt("rejected")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Marcar como Rechazado
            </button>
          )}
        </div>
      )}
    </div>
  );
}
