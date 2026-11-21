import React from "react";
import { brand } from "@/config/brand";

export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto hidden lg:block">
      {/* Contenedor con esquinas muy redondeadas y sombra suave */}
      <div className="relative rounded-3xl overflow-hidden bg-brand-primary-dark/60 border-2 border-white/15 p-6 shadow-2xl backdrop-blur-xs">
        {/* Ilustración SVG estilizada con la paleta de la marca */}
        <div className="w-full aspect-4/3 rounded-2xl bg-gradient-to-br from-brand-surface-soft/20 via-brand-surface-soft/10 to-transparent flex items-center justify-center p-6 border border-white/10">
          <svg
            className="w-44 h-44 text-white drop-shadow-md"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Ilustración representativa de servicios técnicos"
          >
            {/* Círculo de fondo con acento */}
            <circle cx="100" cy="100" r="80" fill="#0B2A5B" stroke="#F97316" strokeWidth="4" />
            
            {/* Silueta de técnico amigable */}
            <circle cx="100" cy="80" r="30" fill="#EAF0FA" />
            <path
              d="M48 160C48 126.863 74.8629 100 108 100C141.137 100 168 126.863 168 160V166H48V160Z"
              fill="#EAF0FA"
            />
            {/* Casco / Gorra protectora */}
            <path
              d="M66 75C66 56.7746 80.7746 42 99 42C117.225 42 132 56.7746 132 75H66Z"
              fill="#F97316"
            />
            <rect x="60" y="73" width="78" height="8" rx="4" fill="#C2410C" />

            {/* Llave inglesa / Herramienta */}
            <g transform="translate(130, 95) rotate(25)">
              <rect x="0" y="0" width="12" height="50" rx="6" fill="#F97316" />
              <circle cx="6" cy="6" r="14" fill="#F97316" />
              <circle cx="6" cy="6" r="6" fill="#0B2A5B" />
            </g>
          </svg>
        </div>

        {/* Tarjeta flotante de confianza */}
        <div className="mt-4 bg-white/95 rounded-2xl p-4 shadow-lg flex items-center gap-3 border border-white/30 text-left">
          <div className="w-10 h-10 rounded-full bg-brand-surface-soft flex items-center justify-center text-brand-accent-dark font-black text-lg shrink-0">
            ✓
          </div>
          <div>
            <p className="text-xs font-bold text-brand-primary">
              Servicios en {brand.coverage.state}
            </p>
            <p className="text-[11px] text-brand-text-muted">
              {brand.coverage.primaryCities.join(" y ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
