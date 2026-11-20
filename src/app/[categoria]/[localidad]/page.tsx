import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Breadcrumbs } from "@/components/directory/Breadcrumbs";
import { LocalityFilter } from "@/components/directory/LocalityFilter";
import { ProfessionalCard } from "@/components/directory/ProfessionalCard";
import {
  getCategoryByListingSlug,
  getLocalityBySlug,
  getActiveLocalitiesForCategory,
  getApprovedProfessionalsByCategory,
} from "@/services/directory";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string; localidad: string }>;
}): Promise<Metadata> {
  const { categoria, localidad } = await params;
  const category = await getCategoryByListingSlug(categoria);
  const loc = await getLocalityBySlug(localidad);

  if (!category || !loc) {
    return {
      title: "Página no encontrada",
    };
  }

  const title = `${category.plural_label} en ${loc.name}, Anzoátegui | ${brand.name}`;
  const description = `Directorio de ${category.plural_label.toLowerCase()} en ${loc.name}, estado Anzoátegui. Técnicos profesionales y empresas de servicios verificados.`;
  const canonical = `${site.url}/${category.listing_slug}/${loc.slug}`;

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
      type: "website",
    },
  };
}

export default async function LocalityListingPage({
  params,
}: {
  params: Promise<{ categoria: string; localidad: string }>;
}) {
  const { categoria, localidad } = await params;
  const category = await getCategoryByListingSlug(categoria);
  const loc = await getLocalityBySlug(localidad);

  if (!category || !loc) {
    notFound();
  }

  // Verificar que esta localidad tenga al menos un profesional aprobado (Regla CLAUDE.md)
  const activeLocalities = await getActiveLocalitiesForCategory(
    category.listing_slug
  );

  const currentCombination = activeLocalities.find(
    (item) => item.locality_slug === loc.slug
  );

  if (!currentCombination || (currentCombination.professional_count || 0) <= 0) {
    notFound();
  }

  // Obtener los profesionales aprobados para esta localidad
  const professionals = await getApprovedProfessionalsByCategory(
    category.id,
    loc.id
  );

  // Esquema estructurado JSON-LD ItemList para SEO local
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.plural_label} en ${loc.name}, Anzoátegui`,
    description: `Directorio de ${category.plural_label.toLowerCase()} en ${loc.name}`,
    numberOfItems: professionals.length,
    itemListElement: professionals.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: p.business_name,
      url: `${site.url}/${category.listing_slug}/${loc.slug}/${p.slug}`,
    })),
  };

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
            {
              name: loc.name,
              url: `/${category.listing_slug}/${loc.slug}`,
            },
          ]}
        />

        {/* Encabezado Principal Local */}
        <div className="space-y-2 border-b border-brand-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-surface-muted text-brand-text-muted border border-brand-border">
            <span>📍 {loc.name}, Anzoátegui</span>
            <span>•</span>
            <span>
              {professionals.length}{" "}
              {professionals.length === 1
                ? "prestador disponible"
                : "prestadores disponibles"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
            {category.plural_label} en {loc.name}
          </h1>

          <p className="text-sm sm:text-base text-brand-text-muted max-w-3xl leading-relaxed">
            Contacta directamente con técnicos y empresas de{" "}
            {category.singular_label.toLowerCase()} en {loc.name} (Anzoátegui).
            Servicios a domicilio con mano de obra calificada.
          </p>

          {/* Filtro por Ciudades */}
          {activeLocalities.length > 0 && (
            <div className="pt-3">
              <LocalityFilter
                categoryListingSlug={category.listing_slug}
                localities={activeLocalities}
                currentLocalitySlug={loc.slug}
              />
            </div>
          )}
        </div>

        {/* Listado de Profesionales de esta Ciudad */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((prof) => (
            <ProfessionalCard
              key={prof.id}
              professional={prof}
              categoryListingSlug={category.listing_slug}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
