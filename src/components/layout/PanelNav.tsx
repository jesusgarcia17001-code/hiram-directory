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
    <header className="border-b border-brand-border bg-brand-surface sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Enlace a Inicio */}
          <div className="flex items-center gap-6">
            <Link
              href="/panel"
              className="inline-flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-base shadow-sm">
                {brand.shortName.charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-base text-brand-text-primary leading-tight">
                  {brand.name}
                </span>
                <span className="text-[10px] text-brand-text-muted font-semibold tracking-wider uppercase">
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
                        ? "bg-brand-surface-muted text-brand-primary border border-brand-border"
                        : "text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface-muted"
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
              <p className="text-xs font-semibold text-brand-text-primary leading-tight">
                {user.fullName || "Usuario"}
              </p>
              <p className="text-[11px] text-brand-text-muted leading-tight">
                {user.email}
              </p>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brand-border text-brand-text-muted hover:text-brand-danger hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="sm:hidden flex items-center gap-2 py-2 border-t border-brand-border">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  isActive
                    ? "bg-brand-primary text-white"
                    : "text-brand-text-muted hover:text-brand-text-primary"
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
