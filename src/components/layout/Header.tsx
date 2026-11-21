import React from "react";
import Link from "next/link";
import { brand } from "@/config/brand";

export function Header() {
  return (
    <header className="w-full border-b border-brand-primary-dark bg-brand-primary text-white sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2.5 focus:outline-none">
          <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-brand-primary-dark font-extrabold text-base shadow-xs">
            {brand.shortName.charAt(0)}
          </div>
          <span className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
            {brand.name}
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-semibold text-white/90 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-brand-primary-dark"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-xs sm:text-sm font-bold text-brand-primary-dark bg-brand-accent hover:bg-brand-accent/90 transition-colors px-3.5 py-2 rounded-xl shadow-xs"
          >
            Registrar mi servicio
          </Link>
        </nav>
      </div>
    </header>
  );
}
