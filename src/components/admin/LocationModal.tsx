"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  createStateAction,
  createMunicipalityAction,
  createLocalityAction,
  updateLocationAction,
  LocationActionResult,
} from "@/features/admin/locations/actions";
import { slugify } from "@/lib/validations/profile";

export interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create-state" | "create-municipality" | "create-locality" | "edit";
  states?: { id: string; name: string }[];
  municipalities?: { id: string; state_id: string; name: string }[];
  defaultStateId?: string;
  defaultMunicipalityId?: string;
  itemToEdit?: {
    type: "state" | "municipality" | "locality";
    id: string;
    name: string;
    slug: string;
    professional_count: number;
  } | null;
}

export function LocationModal({
  isOpen,
  onClose,
  mode,
  states = [],
  municipalities = [],
  defaultStateId,
  defaultMunicipalityId,
  itemToEdit,
}: LocationModalProps) {
  const [isPending, startTransition] = useTransition();

  const [stateId, setStateId] = useState(defaultStateId || "");
  const [municipalityId, setMunicipalityId] = useState(defaultMunicipalityId || "");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [result, setResult] = useState<LocationActionResult | null>(null);

  // Inicializar valores según el modo o el ítem a editar
  useEffect(() => {
    if (!isOpen) return;

    setResult(null);

    if (mode === "edit" && itemToEdit) {
      setName(itemToEdit.name);
      setSlug(itemToEdit.slug);
      setSlugManuallyEdited(true);
    } else {
      setName("");
      setSlug("");
      setIsActive(true);
      setSlugManuallyEdited(false);
      if (defaultStateId) setStateId(defaultStateId);
      if (defaultMunicipalityId) setMunicipalityId(defaultMunicipalityId);
    }
  }, [isOpen, mode, itemToEdit, defaultStateId, defaultMunicipalityId]);

  if (!isOpen) return null;

  // Si estamos editando una localidad y tiene profesionales, el slug se bloquea
  const isLocalitySlugLocked =
    mode === "edit" &&
    itemToEdit?.type === "locality" &&
    (itemToEdit.professional_count || 0) > 0;

  // Filtrar municipios según el estado seleccionado (para crear localidad)
  const availableMunicipalities = municipalities.filter(
    (m) => !stateId || m.state_id === stateId
  );

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slugManuallyEdited && !isLocalitySlugLocked) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    setSlug(slugify(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set("is_active", String(isActive));

    startTransition(async () => {
      let res: LocationActionResult;

      if (mode === "create-state") {
        res = await createStateAction(null, formData);
      } else if (mode === "create-municipality") {
        res = await createMunicipalityAction(null, formData);
      } else if (mode === "create-locality") {
        res = await createLocalityAction(null, formData);
      } else if (mode === "edit" && itemToEdit) {
        res = await updateLocationAction(itemToEdit.type, itemToEdit.id, null, formData);
      } else {
        res = { success: false, message: "Modo de formulario inválido." };
      }

      setResult(res);

      if (res.success) {
        setTimeout(() => {
          onClose();
        }, 600);
      } else if (res.suggestedSlug) {
        // Si hay una sugerencia de slug por colisión, adoptarla
        setSlug(res.suggestedSlug);
      }
    });
  };

  const modalTitles = {
    "create-state": "Crear Nuevo Estado",
    "create-municipality": "Crear Nuevo Municipio",
    "create-locality": "Crear Nueva Localidad / Zona Rural",
    edit: `Editar ${
      itemToEdit?.type === "state"
        ? "Estado"
        : itemToEdit?.type === "municipality"
        ? "Municipio"
        : "Localidad"
    }`,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-brand-surface rounded-2xl max-w-lg w-full p-6 shadow-xl border border-brand-border space-y-5 animate-in fade-in-50 zoom-in-95 duration-150 my-8">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div>
            <h3 className="text-base font-bold text-brand-text-primary">
              {modalTitles[mode]}
            </h3>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Administración de cobertura geográfica para el directorio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Mensaje de resultado / errores */}
        {result && (
          <div
            className={`p-3 rounded-xl text-xs ${
              result.success
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {result.message}
            {result.suggestedSlug && (
              <p className="mt-1 font-semibold text-emerald-700">
                💡 Sugerencia sugerida aplicada: &quot;{result.suggestedSlug}&quot;. Vuelve a hacer clic en Guardar.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selección de Estado (si se crea municipio o localidad) */}
          {(mode === "create-municipality" || mode === "create-locality") && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-primary mb-1">
                Estado Perteneciente *
              </label>
              <select
                name="state_id"
                value={stateId}
                onChange={(e) => {
                  setStateId(e.target.value);
                  setMunicipalityId("");
                }}
                required
                className="w-full px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              >
                <option value="" disabled>
                  -- Selecciona un estado --
                </option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selección de Municipio (si se crea localidad) */}
          {mode === "create-locality" && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-primary mb-1">
                Municipio Perteneciente *
              </label>
              <select
                name="municipality_id"
                value={municipalityId}
                onChange={(e) => setMunicipalityId(e.target.value)}
                required
                disabled={!stateId}
                className="w-full px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:opacity-50"
              >
                <option value="" disabled>
                  {stateId
                    ? "-- Selecciona un municipio --"
                    : "-- Primero selecciona un estado --"}
                </option>
                {availableMunicipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-brand-text-muted mt-1">
                Las zonas rurales se registran como una localidad más asignada a su municipio (ej. &quot;Zona rural de Sotillo&quot;).
              </p>
            </div>
          )}

          {/* Nombre de la ubicación */}
          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1">
              Nombre de {itemToEdit ? "la ubicación" : mode === "create-state" ? "el Estado" : mode === "create-municipality" ? "el Municipio" : "la Localidad"} *
            </label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleNameChange}
              placeholder={
                mode === "create-state"
                  ? "Ej: Anzoátegui, Miranda"
                  : mode === "create-municipality"
                  ? "Ej: Sotillo, Bolívar, Urbaneja"
                  : "Ej: Puerto La Cruz, Lechería, Zona rural de Sotillo"
              }
              required
              className="w-full px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            {result?.errors?.name && (
              <p className="text-[10px] text-brand-danger mt-1">
                {result.errors.name[0]}
              </p>
            )}
          </div>

          {/* Slug URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-brand-text-primary">
                Slug para URLs SEO *
              </label>
              {isLocalitySlugLocked && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  🔒 Slug bloqueado ({itemToEdit?.professional_count} técnicos)
                </span>
              )}
            </div>
            <input
              type="text"
              name="slug"
              value={slug}
              onChange={handleSlugChange}
              disabled={isLocalitySlugLocked}
              placeholder="ej-puerto-la-cruz"
              required
              className="w-full px-3 py-2 text-xs font-mono bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary disabled:opacity-50 disabled:bg-slate-100"
            />
            <p className="text-[10px] text-brand-text-muted mt-1">
              {isLocalitySlugLocked
                ? "Este slug no se puede modificar porque ya tiene profesionales aprobados indexados en Google."
                : "Se genera automáticamente desde el nombre. Solo minúsculas, números y guiones."}
            </p>
            {result?.errors?.slug && (
              <p className="text-[10px] text-brand-danger mt-1">
                {result.errors.slug[0]}
              </p>
            )}
          </div>

          {/* Estado activo inicial (solo en creación) */}
          {mode !== "edit" && (
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-brand-border text-brand-primary focus:ring-brand-primary/20"
                />
                <span className="text-xs text-brand-text-primary font-medium">
                  Crear como ubicación activa inmediatamente
                </span>
              </label>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              {isPending
                ? "Guardando..."
                : mode === "edit"
                ? "Actualizar Ubicación"
                : "Crear Ubicación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
