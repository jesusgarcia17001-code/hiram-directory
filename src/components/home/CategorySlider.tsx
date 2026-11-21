"use client";

import React, { useRef } from "react";
import Link from "next/link";

export interface CategorySliderItem {
  id: string;
  name: string;
  listing_slug: string;
  plural_label: string;
  icon?: string | null;
}

interface CategorySliderProps {
  categories: CategorySliderItem[];
}

const defaultIcons: Record<string, string> = {
  wind: "❄️",
  zap: "⚡",
  wrench: "🔧",
  house: "🏠",
  plumber: "🚰",
  paint: "🎨",
  car: "🚗",
  lock: "🔑",
};

export function CategorySlider({ categories }: CategorySliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-label="Categorías principales">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-brand-primary">
            Explora por categoría
          </h2>
          <p className="text-xs sm:text-sm text-brand-text-muted mt-0.5">
            Encuentra al especialista indicado para tu necesidad
          </p>
        </div>

        {/* CONTROLES DE DESPLAZAMIENTO EN ESCRITORIO */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full bg-brand-surface-soft hover:bg-slate-200 text-brand-primary flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            aria-label="Desplazar categorías a la izquierda"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full bg-brand-surface-soft hover:bg-slate-200 text-brand-primary flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            aria-label="Desplazar categorías a la derecha"
          >
            →
          </button>
        </div>
      </div>

      {/* FILA DESLIZABLE HORIZONTAL */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 focus:outline-none"
        tabIndex={0}
        role="region"
        aria-label="Lista deslizable de categorías"
      >
        {categories.map((cat) => {
          const icon = defaultIcons[cat.icon || ""] || "🛠️";
          return (
            <Link
              key={cat.id}
              href={`/${cat.listing_slug}`}
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-brand-surface border border-slate-200 hover:border-brand-accent hover:shadow-md transition-all shrink-0 group focus:outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">
                {icon}
              </span>
              <span className="text-xs sm:text-sm font-bold text-brand-primary group-hover:text-brand-accent-dark whitespace-nowrap transition-colors">
                {cat.plural_label}
              </span>
              <span className="text-[10px] text-brand-accent-dark font-extrabold ml-1 group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
