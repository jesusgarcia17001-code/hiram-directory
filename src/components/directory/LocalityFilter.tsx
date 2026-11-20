import React from "react";
import Link from "next/link";

interface LocalityItem {
  locality_slug: string;
  locality_name: string;
  professional_count?: number;
}

interface LocalityFilterProps {
  categoryListingSlug: string;
  localities: LocalityItem[];
  currentLocalitySlug?: string;
}

export function LocalityFilter({
  categoryListingSlug,
  localities,
  currentLocalitySlug,
}: LocalityFilterProps) {
  const isAllSelected = !currentLocalitySlug;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
      <span className="text-xs font-semibold text-brand-text-muted whitespace-nowrap">
        Ciudad:
      </span>

      {/* Todo el estado */}
      <Link
        href={`/${categoryListingSlug}`}
        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
          isAllSelected
            ? "bg-brand-primary text-white shadow-xs"
            : "bg-brand-surface text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-muted border border-brand-border"
        }`}
      >
        Todo Anzoátegui
      </Link>

      {/* Ciudades individuales */}
      {localities.map((loc) => {
        const isSelected = currentLocalitySlug === loc.locality_slug;
        return (
          <Link
            key={loc.locality_slug}
            href={`/${categoryListingSlug}/${loc.locality_slug}`}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              isSelected
                ? "bg-brand-primary text-white shadow-xs"
                : "bg-brand-surface text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-muted border border-brand-border"
            }`}
          >
            <span>{loc.locality_name}</span>
            {loc.professional_count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {loc.professional_count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
