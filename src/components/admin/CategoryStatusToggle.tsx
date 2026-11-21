"use client";

import React, { useTransition } from "react";
import { toggleCategoryStatusAction } from "@/features/admin/categories/actions";

interface CategoryStatusToggleProps {
  categoryId: string;
  isActive: boolean;
  categoryName: string;
}

export function CategoryStatusToggle({
  categoryId,
  isActive,
  categoryName,
}: CategoryStatusToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const actionText = isActive ? "desactivar" : "activar";
    if (!confirm(`¿Estás seguro de que deseas ${actionText} la categoría "${categoryName}"?`)) {
      return;
    }

    startTransition(async () => {
      const res = await toggleCategoryStatusAction(categoryId, isActive);
      if (!res.success) {
        alert(res.message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 ${
        isActive ? "bg-emerald-600" : "bg-slate-300"
      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
      title={isActive ? "Hacer clic para desactivar" : "Hacer clic para activar"}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          isActive ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
