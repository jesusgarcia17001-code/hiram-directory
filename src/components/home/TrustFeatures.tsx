import React from "react";
import { brand } from "@/config/brand";

export function TrustFeatures() {
  const icons: Record<string, React.ReactNode> = {
    shield: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
    message: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
    "map-pin": (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  };

  return (
    <section className="w-full bg-brand-surface-soft/60 py-14 sm:py-20 border-y border-brand-surface-soft" aria-label={`Por qué elegir ${brand.name}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-brand-primary">
            Servicio transparente y confiable
          </h2>
          <p className="text-xs sm:text-sm text-brand-text-muted">
            Diseñado para conectar clientes con técnicos reales en Anzoátegui de forma ágil y segura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {brand.trustColumns.map((col, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-100 flex flex-col items-start space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-surface-soft flex items-center justify-center text-brand-accent-dark font-black">
                {icons[col.icon] || "✓"}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-brand-primary mb-2">
                  {col.title}
                </h3>
                <p className="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
                  {col.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
