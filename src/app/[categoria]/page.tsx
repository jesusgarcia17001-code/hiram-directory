import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Breadcrumbs } from "@/components/directory/Breadcrumbs";
import { LocalityFilter } from "@/components/directory/LocalityFilter";
import { ProfessionalCard } from "@/components/directory/ProfessionalCard";
import {
  getCategoryByListingSlug,
  getActiveLocalitiesForCategory,
  getApprovedProfessionalsByCategory,
} from "@/services/directory";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>;
}): Promise<Metadata> {
  const { categoria } = await params;
  const category = await getCategoryByListingSlug(categoria);

  if (!category) {
    return {
      title: "Categoría no encontrada",
    };
  }

  const title = `${category.plural_label} en Anzoátegui | ${brand.name}`;
  const description = `Directorio de ${category.plural_label.toLowerCase()} verificados en Anzoátegui (Puerto La Cruz, Barcelona). Contacta técnicos independientes y empresas de confianza.`;
  const canonical = `${site.url}/${category.listing_slug}`;

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

export default async function CategoryListingPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria } = await params;
  const category = await getCategoryByListingSlug(categoria);

  if (!category) {
    notFound();
  }

  // Obtener ciudades con profesionales aprobados para esta categoría
  const activeLocalities = await getActiveLocalitiesForCategory(
    category.listing_slug
  );

  // Obtener todos los profesionales aprobados en Anzoátegui
  const professionals = await getApprovedProfessionalsByCategory(category.id);

  // Esquema estructurado JSON-LD ItemList para SEO en Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.plural_label} en Anzoátegui`,
    description: `Directorio de ${category.plural_label.toLowerCase()} en el estado Anzoátegui`,
    numberOfItems: professionals.length,
    itemListElement: professionals.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: p.business_name,
      url: `${site.url}/${category.listing_slug}/${
        p.locality_slug || "anzoategui"
      }/${p.slug}`,
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
          ]}
        />

        {/* Encabezado Principal de la Página de Lista */}
        <div className="space-y-2 border-b border-brand-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-surface-muted text-brand-text-muted border border-brand-border">
            <span>📍 Estado Anzoátegui</span>
            <span>•</span>
            <span>{professionals.length} {professionals.length === 1 ? "prestador verificado" : "prestadores verificados"}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
            {category.plural_label} en Anzoátegui
          </h1>

          <p className="text-sm sm:text-base text-brand-text-muted max-w-3xl leading-relaxed">
            {category.description ||
              `Encuentra técnicos independientes y empresas verificadas de ${category.singular_label.toLowerCase()} en Puerto La Cruz, Barcelona y todo el estado Anzoátegui.`}
          </p>

          {/* Filtro por Ciudades */}
          {activeLocalities.length > 0 && (
            <div className="pt-3">
              <LocalityFilter
                categoryListingSlug={category.listing_slug}
                localities={activeLocalities}
              />
            </div>
          )}
        </div>

        {/* Listado de Profesionales */}
        {professionals.length === 0 ? (
          <div className="bg-brand-surface p-12 rounded-2xl border border-dashed border-brand-border text-center space-y-4">
            <span className="text-4xl">🛠️</span>
            <div className="max-w-md mx-auto space-y-1">
              <h2 className="text-base font-bold text-brand-text-primary">
                Aún no hay {category.plural_label.toLowerCase()} aprobados en esta sección
              </h2>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Estamos verificando solicitudes de ingreso. Si prestas servicios de{" "}
                {category.singular_label.toLowerCase()} en Anzoátegui, sé el primero en anunciarte.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-primary text-white shadow-xs hover:bg-brand-primary-hover transition-colors"
              >
                Registrar mi servicio gratis →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map((prof) => (
              <ProfessionalCard
                key={prof.id}
                professional={prof}
                categoryListingSlug={category.listing_slug}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
