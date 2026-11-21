"use client";

import React, { useState, useTransition } from "react";
import { toggleLocationStatusAction } from "@/features/admin/locations/actions";

interface LocationStatusToggleProps {
  type: "state" | "municipality" | "locality";
  id: string;
  name: string;
  isActive: boolean;
  professionalCount: number;
}

export function LocationStatusToggle({
  type,
  id,
  name,
  isActive,
  professionalCount,
}: LocationStatusToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const typeLabels = {
    state: "este estado",
    municipality: "este municipio",
    locality: "esta localidad",
  };

  const handleToggleClick = () => {
    // Si está activa y tiene profesionales asociados, requerir confirmación explícita
    if (isActive && professionalCount > 0) {
      setShowConfirm(true);
      return;
    }
    executeToggle();
  };

  const executeToggle = () => {
    setShowConfirm(false);
    setErrorMsg(null);

    startTransition(async () => {
      const res = await toggleLocationStatusAction(type, id, isActive);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleClick}
          disabled={isPending}
          title={
            isActive
              ? `Desactivar ${typeLabels[type]}`
              : `Activar ${typeLabels[type]}`
          }
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
            isActive ? "bg-emerald-600" : "bg-slate-300"
          } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              isActive ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>

        <span
          className={`text-[11px] font-medium ${
            isActive ? "text-emerald-700" : "text-slate-500"
          }`}
        >
          {isActive ? "Activa" : "Inactiva"}
        </span>
      </div>

      {errorMsg && (
        <span className="text-[10px] text-brand-danger block mt-1">{errorMsg}</span>
      )}

      {/* Modal de Advertencia y Confirmación */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-brand-border space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  ¿Confirmas desactivar {typeLabels[type]}?
                </h3>
                <p className="text-xs text-brand-text-muted mt-1">
                  Ubicación: <strong className="text-brand-text-primary">{name}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 leading-relaxed">
              <strong>Impacto público:</strong>{" "}
              {professionalCount === 1 ? (
                <>
                  Hay <strong>1 profesional aprobado</strong> en esta ubicación.
                  Dejará de aparecer en las listas públicas del directorio SEO
                  mientras la ubicación permanezca inactiva.
                </>
              ) : (
                <>
                  Hay <strong>{professionalCount} profesionales aprobados</strong> en
                  esta ubicación. Dejarán de aparecer en las listas públicas del
                  directorio SEO mientras la ubicación permanezca inactiva.
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeToggle}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs"
              >
                Sí, desactivar ubicación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
