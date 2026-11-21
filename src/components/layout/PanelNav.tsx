"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import { signOutAction } from "@/features/auth/actions";

interface PanelNavProps {
  user: {
    fullName: string;
    email: string;
    role: string;
  };
}

export function PanelNav({ user }: PanelNavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/panel", label: "Inicio / Resumen" },
    { href: "/panel/perfil", label: "Mi Perfil" },
    { href: "/panel/suscripcion", label: "Planes y Pagos" },
  ];

  return (
    <header className="border-b border-brand-primary-dark bg-brand-primary text-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Enlace a Inicio */}
          <div className="flex items-center gap-6">
            <Link
              href="/panel"
              className="inline-flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-brand-primary-dark font-extrabold text-base shadow-xs">
                {brand.shortName.charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-base text-white leading-tight">
                  {brand.name}
                </span>
                <span className="text-[10px] text-white/70 font-semibold tracking-wider uppercase">
                  Panel de Control
                </span>
              </div>
            </Link>

            {/* Enlaces de Navegación del Panel */}
            <nav className="hidden sm:flex items-center gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isActive
                        ? "bg-brand-primary-dark text-white border border-white/20"
                        : "text-white/80 hover:text-white hover:bg-brand-primary-dark"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Perfil del usuario y botón de cerrar sesión */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {user.fullName || "Usuario"}
              </p>
              <p className="text-[11px] text-white/70 leading-tight">
                {user.email}
              </p>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/20 text-white/80 hover:text-white hover:border-red-400 hover:bg-red-950/60 transition-colors cursor-pointer"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="sm:hidden flex items-center gap-2 py-2 border-t border-brand-primary-dark">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  isActive
                    ? "bg-brand-primary-dark text-white"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
