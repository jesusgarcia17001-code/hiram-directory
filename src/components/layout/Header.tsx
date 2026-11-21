"use client";

import React, { useState } from "react";
import Link from "next/link";
import { brand } from "@/config/brand";
import { InstallPwaButton } from "./InstallPwaButton";

export function Header() {
  const [activeTab, setActiveTab] = useState<"clientes" | "tecnico">("clientes");

  return (
    <header className="w-full border-b border-brand-primary-dark bg-brand-primary text-white sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* LOGO */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 sm:gap-2.5 focus:outline-none focus:ring-2 focus:ring-brand-accent rounded-full p-1 shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-accent flex items-center justify-center text-brand-primary-dark font-black text-base shadow-xs">
            {brand.shortName.charAt(0)}
          </div>
          <span className="font-black text-base sm:text-xl text-white tracking-tight">
            {brand.name}
          </span>
        </Link>

        {/* MENÚ EN PÍLDORA (CLIENTES / SOY TÉCNICO) - Visible en escritorio y tablet */}
        <div className="hidden md:flex items-center bg-brand-primary-dark/80 p-1 rounded-full border border-white/10 text-xs font-semibold shadow-inner">
          <Link
            href="/"
            onClick={() => setActiveTab("clientes")}
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeTab === "clientes"
                ? "bg-brand-surface-soft text-brand-primary shadow-xs font-bold"
                : "text-white/80 hover:text-white"
            }`}
          >
            Clientes
          </Link>
          <Link
            href="/register"
            onClick={() => setActiveTab("tecnico")}
            className={`px-4 py-1.5 rounded-full transition-all ${
              activeTab === "tecnico"
                ? "bg-brand-surface-soft text-brand-primary shadow-xs font-bold"
                : "text-white/80 hover:text-white"
            }`}
          >
            Soy técnico
          </Link>
        </div>

        {/* ACCIONES DERECHA: INSTALAR APP, REGISTRARME Y ENTRAR */}
        <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* BOTÓN SUAVE INSTALAR APP (Solo si el navegador lo ofrece) */}
          <InstallPwaButton />

          {/* BOTÓN DE CONTORNO "REGISTRARME COMO TÉCNICO" */}
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-full text-xs sm:text-sm font-bold border border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-brand-primary-dark transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-accent shadow-xs"
          >
            Registrarme como técnico
          </Link>

          {/* ENLACE "ENTRAR" */}
          <Link
            href="/login"
            className="inline-flex items-center text-xs sm:text-sm font-semibold text-white/90 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
