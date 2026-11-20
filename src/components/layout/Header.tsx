import React from "react";
import Link from "next/link";
import { brand } from "@/config/brand";

export function Header() {
  return (
    <header className="w-full border-b border-brand-border bg-brand-surface/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 focus:outline-none">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
            {brand.shortName.charAt(0)}
          </div>
          <span className="font-extrabold text-lg sm:text-xl text-brand-text-primary tracking-tight">
            {brand.name}
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-brand-text-muted hover:text-brand-text-primary transition-colors px-3 py-2 rounded-lg"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover transition-colors px-3.5 py-2 rounded-lg shadow-sm"
          >
            Registrar mi servicio
          </Link>
        </nav>
      </div>
    </header>
  );
}
