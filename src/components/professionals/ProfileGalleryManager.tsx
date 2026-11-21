"use client";

import React, { useState, useTransition, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  uploadGalleryPhotoAction,
  deleteGalleryPhotoAction,
  updatePhotoCaptionAction,
  updatePhotosOrderAction,
} from "@/features/professionals/media-actions";
import { getPublicMediaUrl } from "@/lib/storage-public";

export interface GalleryPhotoItem {
  id: string;
  image_path: string;
  caption: string | null;
  sort_order: number;
}

interface ProfileGalleryManagerProps {
  initialPhotos: GalleryPhotoItem[];
  maxPhotos: number;
  planName: string;
  businessName: string;
}

export function ProfileGalleryManager({
  initialPhotos,
  maxPhotos,
  planName,
  businessName,
}: ProfileGalleryManagerProps) {
  const [photos, setPhotos] = useState<GalleryPhotoItem[]>(initialPhotos);
  const [isPending, startTransition] = useTransition();
  const [captionInput, setCaptionInput] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Estado para edición inline de pie de foto
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasReachedLimit = photos.length >= maxPhotos;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "La foto supera el límite permitido de 5 MB." });
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("caption", captionInput);

    startTransition(async () => {
      const res = await uploadGalleryPhotoAction(formData);
      if (res.success) {
        setMessage({ type: "success", text: res.message || "Foto subida con éxito." });
        setCaptionInput("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Refrescar recargando página suavemente o esperando revalidatePath
        window.location.reload();
      } else {
        setMessage({ type: "error", text: res.message || "No se pudo subir la foto." });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Deseas eliminar esta fotografía de tu galería de trabajos?")) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const res = await deleteGalleryPhotoAction(id);
      if (res.success) {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        setMessage({ type: "success", text: res.message || "Foto eliminada." });
      } else {
        setMessage({ type: "error", text: res.message || "Error al eliminar foto." });
      }
    });
  };

  const handleStartEditCaption = (photo: GalleryPhotoItem) => {
    setEditingPhotoId(photo.id);
    setEditingCaption(photo.caption || "");
  };

  const handleSaveCaption = (photoId: string) => {
    startTransition(async () => {
      const res = await updatePhotoCaptionAction(photoId, editingCaption);
      if (res.success) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, caption: editingCaption } : p))
        );
        setEditingPhotoId(null);
      } else {
        setMessage({ type: "error", text: res.message || "Error al actualizar pie de foto." });
      }
    });
  };

  const handleMovePhoto = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const newPhotos = [...photos];
    const [moved] = newPhotos.splice(index, 1);
    newPhotos.splice(newIndex, 0, moved);

    setPhotos(newPhotos);

    const orderedIds = newPhotos.map((p) => p.id);
    startTransition(async () => {
      await updatePhotosOrderAction(orderedIds);
    });
  };

  return (
    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
            <span>📸</span> Galería de Trabajos Realizados
          </h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Muestra fotografías reales de tus instalaciones, reparaciones o proyectos terminados.
          </p>
        </div>

        {/* Indicador de cuota del plan */}
        <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-brand-text-primary shrink-0">
          <span>{photos.length} de {maxPhotos} fotos</span>
          <span className="text-[10px] text-brand-text-muted font-normal block sm:inline sm:ml-1">
            (Plan {planName})
          </span>
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

      {/* Alerta amable de límite alcanzado con invitación a mejorar */}
      {hasReachedLimit ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">⭐</span>
            <div>
              <p className="font-bold">
                Alcanzaste el límite de fotos de tu plan ({maxPhotos} fotos)
              </p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Para subir más fotografías de tus trabajos y destacar frente a otros técnicos, mejora a un plan superior.
              </p>
            </div>
          </div>
          <Link
            href="/panel/suscripcion"
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs text-center shrink-0"
          >
            Ver Planes y Mejorar →
          </Link>
        </div>
      ) : (
        /* Formulario de subida de nueva foto */
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-semibold text-brand-text-primary">
                Pie de foto o descripción breve (Opcional)
              </label>
              <input
                type="text"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                maxLength={200}
                placeholder="Ej: Instalación de aire split 18000 BTU en Lechería"
                className="w-full px-3 py-2 text-xs bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1 flex flex-col justify-end">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                id="gallery-photo-upload"
                disabled={isPending}
              />
              <label
                htmlFor="gallery-photo-upload"
                className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-xs cursor-pointer ${
                  isPending ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <span>➕</span> {isPending ? "Subiendo..." : "Subir foto a la galería"}
              </label>
            </div>
          </div>
          <p className="text-[10px] text-brand-text-muted">
            Formatos: JPG, PNG o WebP (hasta 5 MB). Se convierte y optimiza a WebP antes de guardar.
          </p>
        </div>
      )}

      {/* Cuadrícula de fotos subidas */}
      {photos.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 text-xs text-brand-text-muted">
          Aún no has agregado fotos a tu galería. Sube fotografías de tus trabajos para generar mayor confianza en tus clientes.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => {
            const photoUrl = getPublicMediaUrl(photo.image_path);
            const isEditingThisCaption = editingPhotoId === photo.id;

            return (
              <div
                key={photo.id}
                className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden shadow-2xs flex flex-col justify-between group"
              >
                {/* Imagen */}
                <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={photo.caption || `Trabajo de ${businessName}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-102 transition-transform duration-200"
                      unoptimized
                    />
                  ) : null}

                  {/* Número de orden */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[10px] font-bold backdrop-blur-xs">
                    #{index + 1}
                  </div>
                </div>

                {/* Pie de foto y controles */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  {isEditingThisCaption ? (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={editingCaption}
                        onChange={(e) => setEditingCaption(e.target.value)}
                        maxLength={200}
                        className="w-full px-2 py-1 text-xs border border-brand-border rounded-lg bg-brand-surface"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveCaption(photo.id)}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-brand-primary text-white rounded"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhotoId(null)}
                          className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      onClick={() => handleStartEditCaption(photo)}
                      className="text-xs text-brand-text-primary line-clamp-2 cursor-pointer hover:text-brand-primary transition-colors"
                      title="Haz clic para editar el pie de foto"
                    >
                      {photo.caption || (
                        <span className="text-slate-400 italic text-[11px]">
                          + Añadir pie de foto
                        </span>
                      )}
                    </p>
                  )}

                  {/* Barra de acciones (reordenar y borrar) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(index, "up")}
                        disabled={index === 0 || isPending}
                        title="Mover foto a la izquierda/arriba"
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(index, "down")}
                        disabled={index === photos.length - 1 || isPending}
                        title="Mover foto a la derecha/abajo"
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-xs"
                      >
                        →
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(photo.id)}
                      disabled={isPending}
                      className="text-slate-400 hover:text-brand-danger transition-colors font-medium text-[11px]"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
