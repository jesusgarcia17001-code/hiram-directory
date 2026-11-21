"use client";

import React, { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { uploadLogoAction, deleteLogoAction } from "@/features/professionals/media-actions";
import { getPublicMediaUrl } from "@/lib/storage-public";

interface ProfileLogoUploaderProps {
  initialLogoPath?: string | null;
  businessName: string;
}

export function ProfileLogoUploader({
  initialLogoPath,
  businessName,
}: ProfileLogoUploaderProps) {
  const [logoPath, setLogoPath] = useState<string | null>(initialLogoPath || null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicUrl = getPublicMediaUrl(logoPath);

  // Iniciales del negocio para avatar neutro
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);

    // Validación básica previa en el navegador
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "La imagen debe pesar menos de 5 MB." });
      return;
    }

    const formData = new FormData();
    formData.append("logo", file);

    startTransition(async () => {
      const res = await uploadLogoAction(formData);
      if (res.success && res.data?.logoPath) {
        setLogoPath(res.data.logoPath);
        setMessage({ type: "success", text: res.message || "Foto actualizada." });
      } else {
        setMessage({ type: "error", text: res.message || "Error al subir foto." });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("¿Seguro que deseas eliminar tu foto de perfil? Se mostrará el avatar neutro.")) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const res = await deleteLogoAction();
      if (res.success) {
        setLogoPath(null);
        setMessage({ type: "success", text: res.message || "Foto eliminada." });
      } else {
        setMessage({ type: "error", text: res.message || "Error al eliminar." });
      }
    });
  };

  return (
    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
      <div>
        <h2 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
          <span>🖼️</span> Foto de Perfil o Logo Comercial
        </h2>
        <p className="text-xs text-brand-text-muted mt-0.5">
          Esta imagen aparecerá en tu perfil público y en los resultados de búsqueda. Disponible en todos los planes.
        </p>
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

      <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
        {/* Vista previa de la imagen o avatar neutro (surface-soft con primary) */}
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-brand-primary/20 bg-brand-surface-soft flex items-center justify-center shrink-0 shadow-xs">
          {publicUrl ? (
            <Image
              src={publicUrl}
              alt={`Logo de ${businessName}`}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-brand-surface-soft text-brand-primary">
              <span className="text-2xl font-black">
                {getInitials(businessName) || "H"}
              </span>
              <span className="text-[9px] font-bold text-brand-text-muted mt-0.5">
                Sin foto
              </span>
            </div>
          )}
        </div>

        {/* Controles de carga y eliminación */}
        <div className="space-y-2 text-center sm:text-left">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            id="profile-logo-upload"
            disabled={isPending}
          />

          <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
            <label
              htmlFor="profile-logo-upload"
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold rounded-xl text-brand-primary-dark bg-brand-accent hover:bg-brand-accent/90 transition-colors shadow-xs cursor-pointer ${
                isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span>📷</span>
              {logoPath ? "Cambiar foto/logo" : "Subir foto/logo"}
            </label>

            {logoPath && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-brand-danger bg-slate-100 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 disabled:opacity-50"
              >
                Eliminar foto
              </button>
            )}
          </div>

          <p className="text-[11px] text-brand-text-muted">
            Formatos aceptados: JPG, PNG o WebP (máx. 5 MB). Se convertirá automáticamente a WebP optimizado.
          </p>
        </div>
      </div>
    </div>
  );
}
