import React from "react";
import Link from "next/link";
import { PublicProfessionalSummary } from "@/services/directory";

interface ProfessionalCardProps {
  professional: PublicProfessionalSummary;
  categoryListingSlug: string;
}

export function ProfessionalCard({
  professional,
  categoryListingSlug,
}: ProfessionalCardProps) {
  const localitySlug = professional.locality_slug || "anzoategui";
  const profileUrl = `/${categoryListingSlug}/${localitySlug}/${professional.slug}`;

  return (
    <article className="bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
      <div className="space-y-3">
        {/* Etiquetas de tipo y destacado */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-surface-muted text-brand-text-muted border border-brand-border">
            {professional.provider_type === "company"
              ? "🏢 Empresa o Taller"
              : "👤 Técnico Profesional"}
          </span>

          {professional.is_featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              ⭐ Destacado
            </span>
          )}
        </div>

        {/* Nombre Comercial y Ciudad */}
        <div>
          <h3 className="text-lg font-bold text-brand-text-primary hover:text-brand-primary transition-colors">
            <Link href={profileUrl}>{professional.business_name}</Link>
          </h3>

          <div className="flex items-center gap-3 text-xs text-brand-text-muted mt-1 flex-wrap">
            {professional.locality_name && (
              <span className="flex items-center gap-1">
                📍 {professional.locality_name}, Anzoátegui
              </span>
            )}

            {professional.experience_years !== null && professional.experience_years > 0 && (
              <span className="flex items-center gap-1">
                ⏱️ {professional.experience_years} años de experiencia
              </span>
            )}
          </div>
        </div>

        {/* Extracto de Descripción */}
        {professional.description && (
          <p className="text-xs text-brand-text-muted line-clamp-3 leading-relaxed">
            {professional.description}
          </p>
        )}
      </div>

      {/* Pie de tarjeta con botón de acción */}
      <div className="pt-4 border-t border-brand-border flex items-center justify-between">
        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Verificado por Hiram
        </span>

        <Link
          href={profileUrl}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primary-hover shadow-xs transition-colors"
        >
          Ver perfil y contactar →
        </Link>
      </div>
    </article>
  );
}
