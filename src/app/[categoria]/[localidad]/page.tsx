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
  getLocalityBySlug,
  getActiveLocalitiesForCategory,
  getApprovedProfessionalsByCategory,
} from "@/services/directory";
import {
  buildLocalityCategoryTitle,
  generateCategoryIntroText,
  generateCategoryFaqs,
} from "@/lib/seo-content";

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
      robots: { index: false, follow: false },
    };
  }

  // REGLA SEMRUSH / CLAUDE.md:
  // Páginas sin perfiles aprobados deben llevar NOINDEX
  const activeLocalities = await getActiveLocalitiesForCategory(
    category.listing_slug
  );
  const currentComb = activeLocalities.find(
    (item) => item.locality_slug === loc.slug
  );
  const hasProfiles = currentComb && (currentComb.professional_count || 0) > 0;

  if (!hasProfiles) {
    return {
      title: `${category.plural_label} en ${loc.name}`,
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  // Título optimizado <= 60 caracteres y sin duplicar marca
  const titleResult = buildLocalityCategoryTitle(category.plural_label, loc.name);
  const description = `Directorio de ${category.plural_label.toLowerCase()} en ${loc.name}, Anzoátegui. Técnicos calificados y servicios a domicilio verificados.`;
  const canonical = `${site.url}/${category.listing_slug}/${loc.slug}`;
  const fullTitle = titleResult.absolute || `${titleResult.title} | ${brand.name}`;

  return {
    title: titleResult.absolute
      ? { absolute: titleResult.absolute }
      : titleResult.title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
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

  // Obtener ciudades con profesionales aprobados para esta categoría
  const activeLocalities = await getActiveLocalitiesForCategory(
    category.listing_slug
  );

  // Obtener los profesionales aprobados para esta localidad
  const professionals = await getApprovedProfessionalsByCategory(
    category.id,
    loc.id
  );

  // Esquema estructurado JSON-LD según Schema.org:
  // Si la lista está vacía, emitir CollectionPage para no violar ItemList
  const jsonLd =
    professionals.length > 0
      ? {
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
        }
      : {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${category.plural_label} en ${loc.name}, Anzoátegui`,
          description: `Directorio de ${category.plural_label.toLowerCase()} en ${loc.name}`,
          url: `${site.url}/${category.listing_slug}/${loc.slug}`,
        };

  const introText = generateCategoryIntroText(category.plural_label, loc.name);
  const faqs = generateCategoryFaqs(category.singular_label, loc.name);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
        <div className="space-y-4 border-b border-brand-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-surface-soft text-brand-primary border border-brand-primary/20">
            <span>📍 {loc.name}, Anzoátegui</span>
            <span>•</span>
            <span>
              {professionals.length}{" "}
              {professionals.length === 1
                ? "prestador disponible"
                : "prestadores disponibles"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-brand-primary tracking-tight">
            {category.plural_label} en {loc.name}
          </h1>

          {/* Bloque de texto introductorio útil (80-150 palabras) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-brand-text-muted leading-relaxed max-w-4xl">
            <p>{introText}</p>
          </div>

          {/* Filtro por Ciudades */}
          {activeLocalities.length > 0 && (
            <div className="pt-2">
              <LocalityFilter
                categoryListingSlug={category.listing_slug}
                localities={activeLocalities}
                currentLocalitySlug={loc.slug}
              />
            </div>
          )}
        </div>

        {/* Listado de Profesionales o Estado Vacío */}
        {professionals.length === 0 ? (
          <div className="bg-brand-surface p-12 rounded-2xl border border-dashed border-brand-border text-center space-y-4">
            <span className="text-4xl">📍</span>
            <div className="max-w-md mx-auto space-y-1">
              <h2 className="text-base font-bold text-brand-primary">
                Aún no hay {category.plural_label.toLowerCase()} registrados en {loc.name}
              </h2>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Si ofreces servicios de {category.singular_label.toLowerCase()} en {loc.name}, regístrate hoy y sé el primero en recibir solicitudes de clientes.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-accent text-brand-primary-dark shadow-xs hover:bg-brand-accent/90 transition-colors"
              >
                Registrar mi servicio en {loc.name}
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

        {/* Preguntas Frecuentes visibles (SEO + Usuario) */}
        <section className="bg-slate-50/80 rounded-2xl p-6 sm:p-8 border border-slate-200/80 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-brand-primary">
              Preguntas Frecuentes en {loc.name}
            </h2>
            <p className="text-xs text-brand-text-muted">
              Consejos para coordinar servicios de {category.plural_label.toLowerCase()} en tu sector
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-2xs space-y-2"
              >
                <h3 className="text-xs font-bold text-brand-primary leading-snug">
                  {faq.question}
                </h3>
                <p className="text-[11px] text-brand-text-muted leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
