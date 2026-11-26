import React from "react";
import Link from "next/link";
import { brand } from "@/config/brand";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSearch } from "@/components/home/HeroSearch";
import { HeroIllustration } from "@/components/home/HeroIllustration";
import { CategorySlider } from "@/components/home/CategorySlider";
import { TrustFeatures } from "@/components/home/TrustFeatures";
import { getActiveCategories } from "@/services/directory";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  // 1. Obtener categorías activas
  const categories = await getActiveCategories();

  // 2. Obtener localidades activas (filtradas por municipio y estado activos)
  const { data: rawLocs } = await supabase
    .from("localities")
    .select(`
      id,
      name,
      slug,
      is_active,
      municipalities (
        id,
        name,
        is_active,
        states (
          id,
          name,
          is_active
        )
      )
    `)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const searchLocalities = (rawLocs || [])
    .filter((l: any) => l.municipalities?.is_active && l.municipalities?.states?.is_active)
    .map((l: any) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      municipality_name: l.municipalities?.name,
    }));

  // 3. Obtener catálogo de servicios activos para autocompletado
  const { data: rawServices } = await supabase
    .from("services")
    .select(`
      id,
      name,
      is_active,
      categories (
        listing_slug
      )
    `)
    .eq("is_active", true)
    .limit(40);

  const searchServices = (rawServices || [])
    .filter((s: any) => s.categories?.listing_slug)
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      category_listing_slug: s.categories.listing_slug,
    }));

  // Mapeo visual de iconos para las categorías
  const categoryIcons: Record<string, string> = {
    wind: "❄️",
    zap: "⚡",
    wrench: "🔧",
    house: "🏠",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-brand-accent selection:text-brand-primary-dark">
      {/* 1. CABECERA INSTITUCIONAL */}
      <Header />

      {/* 2. PORTADA (HERO) A TODO EL ANCHO CON BORDE INFERIOR CURVO */}
      <section className="bg-brand-primary text-white pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 rounded-b-[2.5rem] sm:rounded-b-[4rem] border-b border-brand-primary-dark shadow-xl text-center lg:text-left relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* COLUMNA IZQUIERDA: TITULAR, BUSCADOR Y CHIPS */}
          <div className="lg:col-span-7 space-y-6">
            {/* BADGE DE COBERTURA */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-surface-soft text-brand-primary border border-brand-surface-soft/60 shadow-xs">
              <span>{brand.coverage.country}</span>
              <span>•</span>
              <span>
                {brand.coverage.state} ({brand.coverage.primaryCities.join(", ")})
              </span>
            </div>

            {/* TITULAR GRANDE DE DOS LÍNEAS CON MARCA INTEGRADA */}
            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
              <span className="block text-brand-surface-soft text-xs sm:text-sm font-extrabold uppercase tracking-wider mb-2">
                {brand.name}
              </span>
              <span className="block text-white">{brand.heroTitle.line1}</span>
              <span className="block text-brand-accent mt-1">{brand.heroTitle.line2}</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              {brand.tagline}. {brand.description}
            </p>

            {/* 3. BUSCADOR EN FORMA DE PÍLDORA */}
            <div className="pt-2">
              <HeroSearch
                categories={categories}
                services={searchServices}
                localities={searchLocalities}
              />
            </div>

            {/* 4. TRES CHIPS VERDADEROS BAJO EL BUSCADOR */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
              {brand.trustChips.map((chip, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-surface-soft text-brand-primary border border-brand-surface-soft/80 shadow-xs"
                >
                  <span className="text-brand-accent-dark font-extrabold">✓</span>
                  <span>{chip}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 5. A LA DERECHA DEL HERO: ILUSTRACIÓN EN ESCRITORIO CON ESQUINAS REDONDEADAS */}
          <div className="lg:col-span-5">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* 6. FILA DE CATEGORÍAS CON ICONO (DESLIZABLE EN HORIZONTAL) */}
      <CategorySlider categories={categories} />

      {/* 7. TRES COLUMNAS DE CONFIANZA */}
      <TrustFeatures />

      {/* 8. CONTENIDO EXISTENTE Y RED DE SERVICIOS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">
        {/* DIRECTORIO COMPLETO DE CATEGORÍAS */}
        {categories.length > 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-brand-primary">
                Todos los servicios disponibles en {brand.coverage.state}
              </h2>
              <p className="text-xs sm:text-sm text-brand-text-muted">
                Accede a las listas completas por oficio y localidad
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.listing_slug}`}
                  className="p-5 rounded-2xl bg-brand-surface border border-brand-border hover:border-brand-accent hover:shadow-md transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">
                      {categoryIcons[cat.icon || ""] || "🛠️"}
                    </span>
                    <span className="text-xs text-brand-accent-dark font-extrabold group-hover:translate-x-0.5 transition-transform">
                      Ver lista
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-brand-primary group-hover:text-brand-accent-dark transition-colors">
                      {cat.plural_label}
                    </h3>
                    <p className="text-[11px] text-brand-text-muted line-clamp-2 mt-1">
                      {cat.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* PREGUNTAS FRECUENTES (CONTENIDO TRANSPARENTE) */}
        <section className="bg-slate-50 rounded-3xl p-6 sm:p-10 border border-slate-200/80 space-y-6">
          <div className="text-center space-y-1 max-w-xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-black text-brand-primary">
              Preguntas Frecuentes
            </h3>
            <p className="text-xs sm:text-sm text-brand-text-muted">
              Respuestas directas sobre el funcionamiento del directorio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h4 className="text-sm font-bold text-brand-primary">
                ¿Tiene costo para los clientes?
              </h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                No. Buscar técnicos, revisar especialidades y contactarlos por WhatsApp es 100% gratuito para el público.
              </p>
            </div>

            <div className="space-y-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h4 className="text-sm font-bold text-brand-primary">
                ¿Cómo contacto a un técnico?
              </h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Ingresas al perfil del técnico y tocas el botón de WhatsApp o llamada para coordinar el trabajo directamente con él.
              </p>
            </div>

            <div className="space-y-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h4 className="text-sm font-bold text-brand-primary">
                ¿Cómo registrar mi negocio?
              </h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Toca en &quot;Registrarme como técnico&quot;, completa tus datos y fotos. Nuestro equipo revisará tu perfil antes de publicarlo.
              </p>
            </div>
          </div>
        </section>

        {/* LLAMADO A LA ACCIÓN FINAL PARA TÉCNICOS */}
        <section className="bg-brand-primary text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-3xl font-black">
              ¿Ofreces servicios técnicos en {brand.coverage.state}?
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Únete al directorio profesional de Anzoátegui. Empieza con nuestro plan inicial gratuito y recibe contactos directos de clientes en tu zona.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-sm font-black bg-brand-accent text-brand-primary-dark shadow-md hover:bg-brand-accent/90 transition-all hover:scale-102"
            >
              Crear perfil de técnico
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-full text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER INSTITUCIONAL */}
      <Footer />
    </div>
  );
}
