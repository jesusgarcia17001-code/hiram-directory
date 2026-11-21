"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminCategoryItem } from "@/services/categories";
import { CategoryModal } from "@/components/admin/CategoryModal";
import { CategoryStatusToggle } from "@/components/admin/CategoryStatusToggle";

interface CategoriesManagerProps {
  categories: AdminCategoryItem[];
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategoryItem | null>(null);

  const activeCount = categories.filter((c) => c.is_active).length;
  const inactiveCount = categories.length - activeCount;

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: AdminCategoryItem) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Métricas Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="text-xs text-brand-text-muted flex items-center gap-1.5 mb-1">
            <Link href="/admin" className="hover:text-brand-primary">
              Admin
            </Link>
            <span>/</span>
            <span className="text-brand-text-primary font-medium">Categorías</span>
          </nav>
          <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">
            Gestión de Categorías y Especialidades
          </h1>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Crea y administra las categorías oficiales donde se anuncian los técnicos y empresas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-primary text-white shadow-xs hover:bg-brand-primary-hover transition-colors"
        >
          <span>+</span>
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
          <span className="text-[10px] uppercase font-bold text-brand-text-muted block">
            Total de Especialidades
          </span>
          <span className="text-2xl font-extrabold text-brand-text-primary font-mono mt-1 block">
            {categories.length}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
          <span className="text-[10px] uppercase font-bold text-emerald-600 block">
            Categorías Activas
          </span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono mt-1 block">
            {activeCount}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Categorías Inactivas
          </span>
          <span className="text-2xl font-extrabold text-slate-700 font-mono mt-1 block">
            {inactiveCount}
          </span>
        </div>
      </div>

      {/* Tabla de Categorías */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-surface-muted border-b border-brand-border text-brand-text-muted uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Orden</th>
                <th className="py-3 px-4">Categoría / URL</th>
                <th className="py-3 px-4">Títulos Singular / Plural</th>
                <th className="py-3 px-4">Profesionales</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Activar/Desactivar</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">
                    #{cat.sort_order}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-brand-text-primary flex items-center gap-1.5">
                      {cat.icon && (
                        <span className="p-1 rounded bg-slate-100 text-[10px] font-mono text-slate-600">
                          {cat.icon}
                        </span>
                      )}
                      <span>{cat.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-brand-text-muted mt-0.5">
                      /{cat.listing_slug}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium">{cat.singular_label}</div>
                    <div className="text-slate-500 text-[11px]">{cat.plural_label}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                        cat.professional_count > 0
                          ? "bg-blue-50 text-brand-primary border border-blue-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span>👤</span>
                      <span>{cat.professional_count}</span>
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {cat.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Inactiva
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <CategoryStatusToggle
                      categoryId={cat.id}
                      isActive={cat.is_active}
                      categoryName={cat.name}
                    />
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal interactivo Crear/Editar */}
      <CategoryModal
        category={editingCategory}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
