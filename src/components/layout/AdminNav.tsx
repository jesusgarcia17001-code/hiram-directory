"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/config/brand";
import { signOutAction } from "@/features/auth/actions";

interface AdminNavProps {
  user: {
    fullName: string;
    email: string;
  };
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Inicio / Métricas" },
    { href: "/admin/profesionales", label: "Aprobación de Perfiles" },
    { href: "/admin/pagos", label: "Verificación de Pagos" },
    { href: "/admin/categorias", label: "Categorías" },
  ];

  return (
    <header className="border-b border-brand-border bg-slate-900 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Titular de Administración */}
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                🛡️
              </div>
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-base text-white leading-tight">
                  {brand.name}
                </span>
                <span className="text-[10px] text-red-400 font-bold tracking-wider uppercase">
                  Administración Central
                </span>
              </div>
            </Link>

            {/* Enlaces de Navegación */}
            <nav className="hidden sm:flex items-center gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isActive
                        ? "bg-slate-800 text-white border border-slate-700"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Perfil del admin y opciones */}
          <div className="flex items-center gap-3">
            <Link
              href="/panel"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ← Ir a Vista Panel
            </Link>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {user.fullName || "Administrador"}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {user.email}
              </p>
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-900/60 text-red-300 hover:text-white hover:bg-red-900/40 transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        {/* Navegación móvil */}
        <div className="sm:hidden flex items-center gap-2 py-2 border-t border-slate-800">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/panel"
            className="ml-auto text-xs text-slate-400 hover:text-white"
          >
            Panel →
          </Link>
        </div>
      </div>
    </header>
  );
}
