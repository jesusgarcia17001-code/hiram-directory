"use client";

import React, { useState, useTransition, useEffect } from "react";
import { AdminCategoryItem } from "@/services/categories";
import {
  createCategoryAction,
  updateCategoryAction,
  CategoryActionResult,
} from "@/features/admin/categories/actions";
import { slugify } from "@/lib/validations/profile";

interface CategoryModalProps {
  category?: AdminCategoryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryModal({ category, isOpen, onClose }: CategoryModalProps) {
  const isEditing = Boolean(category);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CategoryActionResult | null>(null);

  // Campos del formulario
  const [name, setName] = useState("");
  const [listingSlug, setListingSlug] = useState("");
  const [singularLabel, setSingularLabel] = useState("");
  const [pluralLabel, setPluralLabel] = useState("");
  const [description, setDescription] = useState("");
  const [seoIntro, setSeoIntro] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Inicializar valores al abrir o cambiar de categoría
  useEffect(() => {
    if (category) {
      setName(category.name);
      setListingSlug(category.listing_slug);
      setSingularLabel(category.singular_label);
      setPluralLabel(category.plural_label);
      setDescription(category.description || "");
      setSeoIntro(category.seo_intro || "");
      setIcon(category.icon || "");
      setSortOrder(category.sort_order);
      setIsActive(category.is_active);
      setSlugManuallyEdited(true);
    } else {
      setName("");
      setListingSlug("");
      setSingularLabel("");
      setPluralLabel("");
      setDescription("");
      setSeoIntro("");
      setIcon("");
      setSortOrder(0);
      setIsActive(true);
      setSlugManuallyEdited(false);
    }
    setResult(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const hasProfessionals = (category?.professional_count || 0) > 0;
  const isSlugLocked = isEditing && hasProfessionals;

  // Auto-generación inteligente del slug mientras escribe el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);

    if (!isSlugLocked && !slugManuallyEdited) {
      const generated = slugify(val);
      setListingSlug(generated);
    }

    // Auto-sugerir singular y plural si están vacíos
    if (!singularLabel || singularLabel === name) {
      setSingularLabel(val);
    }
    if (!pluralLabel || pluralLabel === name) {
      setPluralLabel(val ? `${val}s` : "");
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true);
    // Filtrar caracteres en vivo para permitir solo minúsculas, números y guiones
    const cleaned = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    setListingSlug(cleaned);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("listing_slug", listingSlug.trim());
    formData.append("singular_label", singularLabel.trim());
    formData.append("plural_label", pluralLabel.trim());
    formData.append("description", description.trim());
    formData.append("seo_intro", seoIntro.trim());
    formData.append("icon", icon.trim());
    formData.append("sort_order", sortOrder.toString());
    formData.append("is_active", isActive ? "true" : "false");

    startTransition(async () => {
      let res: CategoryActionResult;
      if (isEditing && category) {
        res = await updateCategoryAction(category.id, null, formData);
      } else {
        res = await createCategoryAction(null, formData);
      }

      setResult(res);
      if (res.success) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? `Editar Categoría: ${category?.name}` : "Nueva Categoría Oficial"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? "Modifica los datos y textos SEO de esta especialidad."
                : "Agrega una nueva especialidad técnica para el directorio y registros."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Alertas */}
          {result && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                result.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <span className="text-base">{result.success ? "✅" : "⚠️"}</span>
              <p className="font-semibold">{result.message}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre General */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="Ej: Cerrajería, Mecánica automotriz, Pintura"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none text-slate-900"
              />
              {result?.errors?.name && (
                <p className="text-[11px] text-red-600 mt-0.5">{result.errors.name[0]}</p>
              )}
            </div>

            {/* Slug de URL (listing_slug) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Slug de URL Pública (`/{`categoria`}`) *
                </label>
                {isSlugLocked && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                    <span>🔒</span> Bloqueado por SEO ({category?.professional_count} técnicos)
                  </span>
                )}
              </div>
              <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary">
                <span className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-mono border-r border-slate-300">
                  hiram.com/
                </span>
                <input
                  type="text"
                  required
                  disabled={isSlugLocked}
                  value={listingSlug}
                  onChange={handleSlugChange}
                  placeholder="cerrajeros, pintores, tecnicos-gas"
                  className={`w-full px-3 py-2 text-xs font-mono focus:outline-none ${
                    isSlugLocked
                      ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                      : "bg-white text-slate-900"
                  }`}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isSlugLocked
                  ? "Esta categoría ya tiene profesionales aprobados. Su URL está protegida para no romper indexación en Google."
                  : "Se genera automáticamente desde el nombre. Solo minúsculas, números y guiones."}
              </p>
              {result?.errors?.listing_slug && (
                <p className="text-[11px] text-red-600 mt-0.5">{result.errors.listing_slug[0]}</p>
              )}
            </div>

            {/* Título Singular */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título Singular (Para Perfiles) *
              </label>
              <input
                type="text"
                required
                value={singularLabel}
                onChange={(e) => setSingularLabel(e.target.value)}
                placeholder="Ej: Cerrajero, Mecánico"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none text-slate-900"
              />
              {result?.errors?.singular_label && (
                <p className="text-[11px] text-red-600 mt-0.5">{result.errors.singular_label[0]}</p>
              )}
            </div>

            {/* Título Plural */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Título Plural (Para Listas y Títulos) *
              </label>
              <input
                type="text"
                required
                value={pluralLabel}
                onChange={(e) => setPluralLabel(e.target.value)}
                placeholder="Ej: Cerrajeros, Mecánicos"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none text-slate-900"
              />
              {result?.errors?.plural_label && (
                <p className="text-[11px] text-red-600 mt-0.5">{result.errors.plural_label[0]}</p>
              )}
            </div>

            {/* Icono */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Identificador de Icono
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="key, wrench, zap, house, car, paint"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none text-slate-900"
              />
            </div>

            {/* Orden de Clasificación */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Posición / Orden (Número)
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none text-slate-900"
              />
            </div>

            {/* Descripción Breve */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descripción Breve de los Servicios
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Servicios de apertura de puertas residenciales y comerciales, duplicado de llaves y cambio de cilindros."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none text-slate-900"
              />
            </div>

            {/* Texto SEO Intro */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Texto Introductorio para SEO (Google)
              </label>
              <textarea
                rows={3}
                value={seoIntro}
                onChange={(e) => setSeoIntro(e.target.value)}
                placeholder="Párrafo destacado que aparecerá en la parte superior de la página de categoría para ayudar al posicionamiento web."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:outline-none text-slate-900"
              />
            </div>

            {/* Estado Activa / Inactiva */}
            <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-slate-200">
              <input
                type="checkbox"
                id="is_active_checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-brand-primary rounded border-slate-300 focus:ring-brand-primary cursor-pointer"
              />
              <label
                htmlFor="is_active_checkbox"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Categoría activa (visible para registro de técnicos y directorio público)
              </label>
            </div>
          </div>

          {/* Botones del pie */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 text-xs font-bold bg-brand-primary text-white rounded-xl shadow-xs hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
            >
              {isPending
                ? "Guardando..."
                : isEditing
                ? "Guardar Cambios"
                : "Crear Categoría"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
