"use client";

import React, { useState, useTransition } from "react";
import {
  addProfessionalServiceAction,
  deleteProfessionalServiceAction,
} from "@/features/professionals/media-actions";

export interface ProfessionalServiceItem {
  id: string;
  name: string;
  service_id?: string | null;
}

export interface CatalogServiceItem {
  id: string;
  name: string;
}

interface ProfileServicesManagerProps {
  initialServices: ProfessionalServiceItem[];
  suggestedCatalogServices: CatalogServiceItem[];
  categoryName?: string;
}

export function ProfileServicesManager({
  initialServices,
  suggestedCatalogServices,
  categoryName,
}: ProfileServicesManagerProps) {
  const [services, setServices] = useState<ProfessionalServiceItem[]>(initialServices);
  const [customInput, setCustomInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const maxServices = 15;
  const hasReachedLimit = services.length >= maxServices;

  // Filtrar sugerencias que el profesional aún no ha agregado (comparación por nombre en minúsculas)
  const availableSuggestions = suggestedCatalogServices.filter(
    (sug) => !services.some((s) => s.name.toLowerCase() === sug.name.toLowerCase())
  );

  const handleAddService = (name: string, serviceId?: string | null) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setMessage({ type: "error", text: "El nombre del servicio debe tener al menos 2 caracteres." });
      return;
    }

    if (services.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setMessage({ type: "error", text: "Este servicio ya está agregado a tu lista." });
      return;
    }

    if (hasReachedLimit) {
      setMessage({ type: "error", text: `Ya alcanzaste el límite de ${maxServices} servicios.` });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const res = await addProfessionalServiceAction(trimmed, serviceId);
      if (res.success) {
        setServices((prev) => [
          ...prev,
          { id: crypto.randomUUID(), name: trimmed, service_id: serviceId },
        ]);
        setCustomInput("");
        setMessage({ type: "success", text: res.message || "Servicio agregado." });
      } else {
        setMessage({ type: "error", text: res.message || "Error al agregar servicio." });
      }
    });
  };

  const handleDeleteService = (serviceId: string) => {
    setMessage(null);
    startTransition(async () => {
      const res = await deleteProfessionalServiceAction(serviceId);
      if (res.success) {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
        setMessage({ type: "success", text: res.message || "Servicio eliminado." });
      } else {
        setMessage({ type: "error", text: res.message || "Error al eliminar servicio." });
      }
    });
  };

  return (
    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
            <span>🛠️</span> Servicios que Ofreces
          </h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Agrega los trabajos y soluciones específicas que realizas. Aparecerán como etiquetas en tu perfil público.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-brand-text-primary shrink-0">
          <span>{services.length} de {maxServices} servicios</span>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Lista actual de servicios (Etiquetas / Chips) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-brand-text-primary">
          Servicios activos en tu perfil:
        </label>

        {services.length === 0 ? (
          <p className="text-xs text-brand-text-muted italic py-2">
            Aún no has agregado ningún servicio específico. Puedes hacer clic en las sugerencias de abajo o escribir los tuyos propios.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {services.map((svc) => (
              <span
                key={svc.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-surface-muted text-brand-text-primary border border-brand-border group hover:border-slate-400 transition-colors"
              >
                <span>{svc.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteService(svc.id)}
                  disabled={isPending}
                  className="w-4 h-4 rounded-full hover:bg-red-100 hover:text-brand-danger flex items-center justify-center text-xs text-slate-400 transition-colors"
                  title="Eliminar servicio"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Sugerencias del catálogo según categoría */}
      {!hasReachedLimit && availableSuggestions.length > 0 && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <p className="text-xs font-bold text-brand-text-primary">
            💡 Sugerencias populares {categoryName ? `en ${categoryName}` : "para tu especialidad"}:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.map((sug) => (
              <button
                key={sug.id}
                type="button"
                onClick={() => handleAddService(sug.name, sug.id)}
                disabled={isPending}
                className="px-2.5 py-1 text-xs font-medium bg-white text-slate-700 hover:text-brand-primary hover:border-brand-primary border border-slate-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>+</span> {sug.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Agregar servicio personalizado */}
      {!hasReachedLimit && (
        <div className="pt-2">
          <label className="block text-xs font-semibold text-brand-text-primary mb-1">
            Agregar otro servicio personalizado (2 a 120 caracteres):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Ej: Mantenimiento correctivo de compresores inverter"
              maxLength={120}
              disabled={isPending}
              className="flex-1 px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            <button
              type="button"
              onClick={() => handleAddService(customInput)}
              disabled={isPending || customInput.trim().length < 2}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl transition-colors shadow-xs disabled:opacity-50 shrink-0"
            >
              + Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
