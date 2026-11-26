import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Breadcrumbs } from "@/components/directory/Breadcrumbs";
import { ContactBox } from "@/components/directory/ContactBox";
import { getApprovedProfessionalBySlug } from "@/services/directory";
import { recordProfileVisit } from "@/services/metrics";
import { getPublicMediaUrl } from "@/lib/storage-public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string; localidad: string; slug: string }>;
}): Promise<Metadata> {
  const { categoria, localidad, slug } = await params;
  const result = await getApprovedProfessionalBySlug(slug);

  if (
    !result ||
    result.category?.listing_slug !== categoria ||
    result.locality?.slug !== localidad
  ) {
    return {
      title: "Profesional no encontrado",
    };
  }

  const { professional, locality, category } = result;
  const title = `${professional.business_name} - ${category.singular_label} en ${locality.name}, Anzoátegui | ${brand.name}`;
  const description = professional.description
    ? professional.description.slice(0, 155)
    : `Contacta a ${professional.business_name}, especialista en ${category.singular_label.toLowerCase()} en ${locality.name}, estado Anzoátegui.`;
  const canonical = `${site.url}/${category.listing_slug}/${locality.slug}/${professional.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: brand.name,
      locale: "es_VE",
      type: "profile",
    },
  };
}

export default async function ProfessionalProfilePage({
  params,
}: {
  params: Promise<{ categoria: string; localidad: string; slug: string }>;
}) {
  const { categoria, localidad, slug } = await params;
  const result = await getApprovedProfessionalBySlug(slug);

  // Validación estricta de la jerarquía de URL
  if (
    !result ||
    !result.locality ||
    !result.category ||
    result.category.listing_slug !== categoria ||
    result.locality.slug !== localidad
  ) {
    notFound();
  }

  const { professional, locality, category } = result;

  // Registrar visita única del perfil en el servidor (Fase 4 - Cuota y Métricas)
  await recordProfileVisit(professional.id);

  const logoUrl = getPublicMediaUrl(professional.logo_path);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  };

  // Esquema estructurado JSON-LD LocalBusiness para Google
  // REGLA CLAUDE.md: Sin reseñas ni valoraciones inventadas
  const sameAs: string[] = [];
  if (professional.instagram_handle) {
    sameAs.push(`https://instagram.com/${professional.instagram_handle}`);
  }
  if (professional.tiktok_handle) {
    sameAs.push(`https://tiktok.com/@${professional.tiktok_handle}`);
  }
  if (professional.facebook_url) {
    sameAs.push(professional.facebook_url);
  }
  if (professional.website_url) {
    sameAs.push(professional.website_url);
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: professional.business_name,
    description:
      professional.description ||
      `${category.singular_label} en ${locality.name}, Anzoátegui`,
    url: `${site.url}/${category.listing_slug}/${locality.slug}/${professional.slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: locality.name,
      addressRegion: "Anzoátegui",
      addressCountry: "VE",
    },
  };

  if (sameAs.length > 0) {
    jsonLd.sameAs = sameAs;
  }

  if (professional.contact_person_name) {
    jsonLd.founder = {
      "@type": "Person",
      name: professional.contact_person_name,
    };
  }

  const listUrl = `/${category.listing_slug}/${locality.slug}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Migas de Pan */}
        <Breadcrumbs
          items={[
            { name: "Inicio", url: "/" },
            { name: category.plural_label, url: `/${category.listing_slug}` },
            { name: locality.name, url: listUrl },
            {
              name: professional.business_name,
              url: `/${category.listing_slug}/${locality.slug}/${professional.slug}`,
            },
          ]}
        />

        {/* Enlace de Retorno a la Lista de la Ciudad (Accent-Dark sobre Blanco) */}
        <div>
          <Link
            href={listUrl}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent-dark hover:underline transition-colors"
          >
            Ver todos los {category.plural_label.toLowerCase()} en {locality.name}
          </Link>
        </div>

        {/* Estructura Principal en 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Información del Profesional */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cabecera del Perfil con Foto/Logo */}
            <div className="bg-brand-surface p-6 sm:p-8 rounded-2xl border border-brand-border shadow-xs space-y-4">
              <div className="flex items-start gap-4 sm:gap-6">
                {/* Logo o Avatar Neutro */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-brand-primary/20 bg-brand-surface-soft flex items-center justify-center shrink-0 shadow-xs">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={`${professional.business_name} - ${category.singular_label}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-brand-primary font-black text-xl sm:text-2xl">
                      {getInitials(professional.business_name) || "H"}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-surface-soft text-brand-primary border border-brand-primary/20">
                      {professional.provider_type === "company"
                        ? "🏢 Empresa / Taller"
                        : "👤 Técnico Profesional"}
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Verificado por {brand.shortName}
                    </span>

                    {professional.is_featured && (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-brand-surface-soft text-brand-accent-dark border border-brand-accent-dark/30">
                        ⭐ Destacado
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-brand-primary tracking-tight">
                    {professional.business_name}
                  </h1>

                  {professional.contact_person_name && (
                    <p className="text-sm font-semibold text-brand-text-muted flex items-center gap-1.5 pt-0.5">
                      <span>👤</span>
                      <span>
                        {professional.provider_type === "company"
                          ? "Persona de contacto:"
                          : "Atendido por:"}{" "}
                        <strong className="text-brand-text-primary">
                          {professional.contact_person_name}
                        </strong>
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-brand-text-muted pt-4 border-t border-brand-border">
                <div className="flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <span>
                    Base: <strong className="text-brand-text-primary">{locality.name}</strong>, Estado Anzoátegui
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-base">🛠️</span>
                  <span>
                    Rubro: <strong className="text-brand-text-primary">{category.singular_label}</strong>
                  </span>
                </div>

                {professional.experience_years !== null && professional.experience_years > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-base">⏱️</span>
                    <span>
                      Experiencia: <strong className="text-brand-text-primary">{professional.experience_years} años</strong>
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <span>
                    Disponibilidad: <strong className="text-brand-text-primary capitalize">{professional.availability === "available" ? "Disponible" : professional.availability}</strong>
                  </span>
                </div>
              </div>

              {/* Canales Oficiales y Redes Sociales */}
              {(professional.instagram_handle ||
                professional.tiktok_handle ||
                professional.facebook_url ||
                professional.website_url) && (
                <div className="pt-4 border-t border-brand-border">
                  <span className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider block mb-2.5">
                    Canales Oficiales y Redes
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {professional.instagram_handle && (
                      <a
                        href={`https://instagram.com/${professional.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 border border-pink-200 hover:from-pink-100 hover:to-purple-100 transition-colors shadow-2xs"
                      >
                        <span className="font-bold">📸 Instagram</span>
                        <span className="text-pink-600 font-mono text-[11px]">
                          @{professional.instagram_handle}
                        </span>
                      </a>
                    )}
                    {professional.tiktok_handle && (
                      <a
                        href={`https://tiktok.com/@${professional.tiktok_handle}`}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-2xs"
                      >
                        <span className="font-bold">🎵 TikTok</span>
                        <span className="text-slate-300 font-mono text-[11px]">
                          @{professional.tiktok_handle}
                        </span>
                      </a>
                    )}
                    {professional.facebook_url && (
                      <a
                        href={professional.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs"
                      >
                        <span className="font-bold">📘 Facebook</span>
                      </a>
                    )}
                    {professional.website_url && (
                      <a
                        href={professional.website_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-surface-soft text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/10 transition-colors shadow-2xs"
                      >
                        <span className="font-bold">🌐 Sitio Web</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Servicios Ofrecidos (Chips en Surface-Soft con texto Primary) */}
            {professional.services && professional.services.length > 0 && (
              <div className="bg-brand-surface p-6 sm:p-8 rounded-2xl border border-brand-border shadow-xs space-y-3">
                <h2 className="text-base font-bold text-brand-primary flex items-center gap-2">
                  <span>🛠️</span> Servicios Especializados
                </h2>
                <div className="flex flex-wrap gap-2">
                  {professional.services.map((svc: any) => (
                    <span
                      key={svc.id}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-surface-soft text-brand-primary border border-brand-primary/20 shadow-2xs"
                    >
                      {svc.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Galería de Trabajos Realizados */}
            {professional.photos && professional.photos.length > 0 && (
              <div className="bg-brand-surface p-6 sm:p-8 rounded-2xl border border-brand-border shadow-xs space-y-4">
                <h2 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
                  <span>📸</span> Galería de Trabajos y Proyectos Realizados
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {professional.photos.map((photo: any) => {
                    const pUrl = getPublicMediaUrl(photo.image_path);
                    return (
                      <figure
                        key={photo.id}
                        className="rounded-xl border border-brand-border overflow-hidden bg-slate-100 flex flex-col shadow-2xs"
                      >
                        <div className="relative aspect-4/3 w-full overflow-hidden">
                          {pUrl ? (
                            <Image
                              src={pUrl}
                              alt={photo.caption || `${professional.business_name} - ${category.singular_label}`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover hover:scale-102 transition-transform duration-200"
                              unoptimized
                            />
                          ) : null}
                        </div>
                        {photo.caption && (
                          <figcaption className="p-2.5 text-xs text-brand-text-muted bg-brand-surface border-t border-brand-border leading-snug">
                            {photo.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Descripción del Servicio */}
            <div className="bg-brand-surface p-6 sm:p-8 rounded-2xl border border-brand-border shadow-xs space-y-3">
              <h2 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
                <span>📄</span> Descripción y Especialidad
              </h2>
              <div className="text-sm text-brand-text-muted leading-relaxed whitespace-pre-line">
                {professional.description || (
                  <p className="italic text-slate-400">
                    Este prestador no ha agregado una descripción detallada de sus servicios.
                  </p>
                )}
              </div>
            </div>

            {/* Zonas de Servicio en Anzoátegui */}
            {professional.service_areas && professional.service_areas.length > 0 && (
              <div className="bg-brand-surface p-6 sm:p-8 rounded-2xl border border-brand-border shadow-xs space-y-3">
                <h2 className="text-base font-bold text-brand-text-primary flex items-center gap-2">
                  <span>🗺️</span> Zonas de Cobertura y Atención a Domicilio
                </h2>
                <div className="flex items-center flex-wrap gap-2">
                  {professional.service_areas.map((area: string) => (
                    <span
                      key={area}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-brand-surface-muted text-brand-text-primary border border-brand-border"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Tarjeta de Contacto Protegida */}
          <div>
            <ContactBox
              professionalId={professional.id}
              professionalName={professional.business_name}
              categoryLabel={category.singular_label}
              contactsEnabled={professional.contacts_enabled}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
