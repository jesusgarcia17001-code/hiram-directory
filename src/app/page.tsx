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

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 my-auto py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-surface-muted text-brand-text-muted border border-brand-border shadow-xs">
            <span>{brand.coverage.country}</span>
            <span>•</span>
            <span>
              {brand.coverage.state} ({brand.coverage.primaryCities.join(", ")})
            </span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-brand-text-primary">
            {brand.name}
          </h1>

          <p className="text-xl text-brand-text-muted leading-relaxed">
            {brand.tagline}
          </p>

          <p className="text-sm text-brand-text-muted max-w-xl mx-auto">
            {brand.description}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold bg-brand-primary text-white shadow-sm hover:bg-brand-primary-hover transition-colors"
            >
              Registrarme como Técnico o Empresa
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold border border-brand-border text-brand-text-primary hover:bg-brand-surface-muted transition-colors"
            >
              Acceso a mi panel
            </Link>
          </div>
        </div>

        {/* Sección de Exploración por Categoría */}
        {categories.length > 0 && (
          <div className="w-full max-w-4xl mx-auto space-y-4 pt-6">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold text-brand-text-primary">
                Servicios disponibles en Anzoátegui
              </h2>
              <p className="text-xs text-brand-text-muted">
                Explora el directorio de especialistas en Puerto La Cruz, Barcelona y zonas cercanas
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.listing_slug}`}
                  className="p-5 rounded-2xl bg-brand-surface border border-brand-border hover:border-brand-primary/40 hover:shadow-md transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">
                      {categoryIcons[cat.icon || ""] || "🛠️"}
                    </span>
                    <span className="text-xs text-brand-primary font-bold group-hover:translate-x-0.5 transition-transform">
                      Ver lista →
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-brand-text-primary group-hover:text-brand-primary transition-colors">
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
