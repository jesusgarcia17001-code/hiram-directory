"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";

export interface SearchCategoryItem {
  id: string;
  name: string;
  listing_slug: string;
  singular_label: string;
  plural_label: string;
}

export interface SearchServiceItem {
  id: string;
  name: string;
  category_listing_slug: string;
}

export interface SearchLocalityItem {
  id: string;
  name: string;
  slug: string;
  municipality_name?: string;
}

interface HeroSearchProps {
  categories: SearchCategoryItem[];
  services?: SearchServiceItem[];
  localities: SearchLocalityItem[];
}

interface SuggestionItem {
  label: string;
  type: "categoría" | "servicio";
  categorySlug: string;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function HeroSearch({ categories, services = [], localities }: HeroSearchProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  const [selectedLocalitySlug, setSelectedLocalitySlug] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calcular sugerencias en tiempo real sin distinguir acentos ni mayúsculas
  const suggestions = useMemo<SuggestionItem[]>(() => {
    const q = normalize(query);
    if (!q) return [];

    const results: SuggestionItem[] = [];

    // 1. Coincidencias en categorías
    for (const cat of categories) {
      const matchCat =
        normalize(cat.name).includes(q) ||
        normalize(cat.singular_label).includes(q) ||
        normalize(cat.plural_label).includes(q) ||
        normalize(cat.listing_slug).includes(q);

      if (matchCat) {
        results.push({
          label: cat.plural_label || cat.name,
          type: "categoría",
          categorySlug: cat.listing_slug,
        });
      }
    }

    // 2. Coincidencias en servicios catalogados
    for (const s of services) {
      if (normalize(s.name).includes(q)) {
        // Evitar duplicar la misma etiqueta si ya existe
        if (!results.some((r) => normalize(r.label) === normalize(s.name))) {
          results.push({
            label: s.name,
            type: "servicio",
            categorySlug: s.category_listing_slug,
          });
        }
      }
      if (results.length >= 7) break;
    }

    return results.slice(0, 7);
  }, [query, categories, services]);

  // Cerrar desplegable al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejar selección de sugerencia
  const handleSelectSuggestion = (s: SuggestionItem) => {
    setQuery(s.label);
    setSelectedCategorySlug(s.categorySlug);
    setIsDropdownOpen(false);
    setFocusedIndex(-1);
  };

  // Manejar navegación con teclado en el autocompletado
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1 < suggestions.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[focusedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setFocusedIndex(-1);
    }
  };

  // Ejecutar búsqueda y redirección SEO
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let targetCategory = selectedCategorySlug;

    // Si no seleccionó explícitamente una sugerencia, deducir la categoría más afín
    if (!targetCategory && query.trim()) {
      const q = normalize(query);
      const directCat = categories.find(
        (c) =>
          normalize(c.name).includes(q) ||
          normalize(c.singular_label).includes(q) ||
          normalize(c.plural_label).includes(q) ||
          normalize(c.listing_slug).includes(q)
      );

      if (directCat) {
        targetCategory = directCat.listing_slug;
      } else if (suggestions.length > 0) {
        targetCategory = suggestions[0].categorySlug;
      }
    }

    // Si aún no hay categoría deducida, tomar la primera activa disponible
    if (!targetCategory && categories.length > 0) {
      targetCategory = categories[0].listing_slug;
    }

    if (!targetCategory) return;

    // Construir URL SEO requerida: /{categoria}/{localidad} o /{categoria}
    const targetUrl = selectedLocalitySlug
      ? `/${targetCategory}/${selectedLocalitySlug}`
      : `/${targetCategory}`;

    router.push(targetUrl);
  };

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto relative z-30">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-2xl border border-white/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        role="search"
        aria-label="Buscar técnicos y servicios"
      >
        {/* 1. CAMPO DE BÚSQUEDA CON SUGERENCIAS */}
        <div className="relative flex-1 flex items-center px-3 sm:px-4">
          <svg
            className="w-5 h-5 text-brand-text-muted shrink-0 mr-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedCategorySlug(""); // restablecer slug manual
              setIsDropdownOpen(true);
              setFocusedIndex(-1);
            }}
            onFocus={() => {
              if (query.trim()) setIsDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ej: plomero urgente"
            aria-label="Buscar técnicos o servicios"
            className="w-full bg-transparent py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-brand-primary placeholder:text-brand-text-muted/70 focus:outline-none"
            autoComplete="off"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={isDropdownOpen}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedCategorySlug("");
                setIsDropdownOpen(false);
                inputRef.current?.focus();
              }}
              className="text-xs text-brand-text-muted hover:text-brand-primary px-1.5 py-0.5 rounded-full hover:bg-slate-100 mr-1"
              title="Borrar texto"
            >
              ✕
            </button>
          )}
        </div>

        {/* SEPARADOR VERTICAL EN ESCRITORIO */}
        <div className="hidden sm:block w-px h-8 bg-slate-200" aria-hidden="true" />

        {/* 2. SELECTOR DE LOCALIDADES ACTIVAS */}
        <div className="flex items-center px-3 sm:px-4 sm:w-64 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
          <svg
            className="w-5 h-5 text-brand-text-muted shrink-0 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>

          <select
            value={selectedLocalitySlug}
            onChange={(e) => setSelectedLocalitySlug(e.target.value)}
            className="w-full bg-transparent py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-brand-primary focus:outline-none cursor-pointer truncate"
            aria-label="Seleccionar localidad"
          >
            <option value="">Todas las localidades</option>
            {localities.map((loc) => (
              <option key={loc.id} value={loc.slug}>
                {loc.name} {loc.municipality_name ? `(${loc.municipality_name})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 3. BOTÓN PRINCIPAL BUSCAR */}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-black bg-brand-accent text-brand-primary-dark hover:bg-brand-accent/90 transition-all shadow-md hover:scale-102 focus:outline-none focus:ring-2 focus:ring-brand-accent cursor-pointer shrink-0"
        >
          <span>Buscar</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </form>

      {/* 4. MENÚ FLOTANTE DE SUGERENCIAS */}
      {isDropdownOpen && suggestions.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 z-50 text-left"
        >
          {suggestions.map((s, idx) => {
            const isSelected = idx === focusedIndex;
            return (
              <li
                key={`${s.categorySlug}-${s.label}-${idx}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={() => handleSelectSuggestion(s)}
                className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-brand-surface-soft text-brand-primary"
                    : "hover:bg-slate-50 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">
                    {s.type === "categoría" ? "📂" : "🔧"}
                  </span>
                  <div>
                    <span className="text-sm font-bold block">{s.label}</span>
                    <span className="text-[11px] text-brand-text-muted capitalize">
                      {s.type}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-extrabold text-brand-accent-dark">
                  Ver lista
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
