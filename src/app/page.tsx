import Link from "next/link";
import { brand } from "@/config/brand";
import { Header } from "@/components/layout/Header";
import { getActiveCategories } from "@/services/directory";

export default async function HomePage() {
  const categories = await getActiveCategories();

  // Mapeo visual de iconos para las categorías
  const categoryIcons: Record<string, string> = {
    wind: "❄️",
    zap: "⚡",
    wrench: "🔧",
    house: "🏠",
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* 1. PORTADA / HERO EN BRAND-PRIMARY CON TEXTO BLANCO */}
      <section className="bg-brand-primary text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-brand-primary-dark text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-surface-soft text-brand-primary border border-brand-surface-soft/60 shadow-xs">
            <span>{brand.coverage.country}</span>
            <span>•</span>
            <span>
              {brand.coverage.state} ({brand.coverage.primaryCities.join(", ")})
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl text-white">
            {brand.name}
          </h1>

          <p className="text-xl sm:text-2xl text-white/95 font-medium leading-relaxed max-w-2xl mx-auto">
            {brand.tagline}
          </p>

          <p className="text-sm text-slate-200 max-w-xl mx-auto leading-relaxed">
            {brand.description}
          </p>

          {/* BOTÓN PRINCIPAL: FONDO ACCENT CON TEXTO PRIMARY-DARK */}
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-extrabold bg-brand-accent text-brand-primary-dark shadow-md hover:bg-brand-accent/90 transition-all hover:scale-102"
            >
              Registrarme como Técnico o Empresa
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition-colors"
            >
              Acceso a mi panel
            </Link>
          </div>
        </div>
      </section>

      {/* 2. EXPLORACIÓN DE CATEGORÍAS (ENLACES DE ACENTO EN ACCENT-DARK) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {categories.length > 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black text-brand-primary">
                Servicios disponibles en Anzoátegui
              </h2>
              <p className="text-xs text-brand-text-muted">
                Explora el directorio de especialistas certificados en Puerto La Cruz, Barcelona y zonas cercanas
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
                    {/* ENLACES SOBRE BLANCO EN ACCENT-DARK */}
                    <span className="text-xs text-brand-accent-dark font-extrabold group-hover:translate-x-0.5 transition-transform">
                      Ver lista →
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
      </main>
    </div>
  );
}
