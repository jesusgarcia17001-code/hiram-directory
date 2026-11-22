import React from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicProfessionalSummary } from "@/services/directory";
import { getPublicMediaUrl } from "@/lib/storage-public";
import { brand } from "@/config/brand";

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
  const logoUrl = getPublicMediaUrl(professional.logo_path);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  };

  return (
    <article className="bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
      <div className="space-y-4">
        {/* Cabecera con Logo y Etiquetas */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Logo o Avatar Neutro */}
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-brand-primary/20 bg-brand-surface-soft flex items-center justify-center shrink-0 shadow-2xs">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={`${professional.business_name} - ${categoryListingSlug}`}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-brand-primary font-black text-sm">
                  {getInitials(professional.business_name) || "H"}
                </span>
              )}
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-surface-soft text-brand-primary border border-brand-primary/20">
                {professional.provider_type === "company"
                  ? "🏢 Empresa o Taller"
                  : "👤 Técnico Profesional"}
              </span>

              <h3 className="text-base font-bold text-brand-primary hover:text-brand-accent-dark transition-colors mt-1">
                <Link href={profileUrl}>{professional.business_name}</Link>
              </h3>
            </div>
          </div>

          {professional.is_featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-surface-soft text-brand-accent-dark border border-brand-accent-dark/30 shrink-0">
              ⭐ Destacado
            </span>
          )}
        </div>

        {/* Ciudad y Experiencia */}
        <div className="flex items-center gap-3 text-xs text-brand-text-muted flex-wrap">
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

        {/* Extracto de Descripción */}
        {professional.description && (
          <p className="text-xs text-brand-text-muted line-clamp-3 leading-relaxed">
            {professional.description}
          </p>
        )}
      </div>

      {/* Pie de tarjeta con botón de acción (ACCENT con PRIMARY-DARK) */}
      <div className="pt-4 border-t border-brand-border flex items-center justify-between">
        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Verificado por {brand.shortName}
        </span>

        <Link
          href={profileUrl}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-brand-accent text-brand-primary-dark hover:bg-brand-accent/90 shadow-xs transition-colors"
        >
          Ver perfil y contactar →
        </Link>
      </div>
    </article>
  );
}
