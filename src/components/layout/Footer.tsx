import React from "react";
import Link from "next/link";
import { brand } from "@/config/brand";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-brand-primary-dark text-white border-t border-brand-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* IDENTIDAD */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-brand-primary-dark font-black text-base">
                {brand.shortName.charAt(0)}
              </div>
              <span className="font-black text-lg text-white tracking-tight">
                {brand.name}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
              {brand.description}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90">
              <span>{brand.coverage.country}</span>
              <span>•</span>
              <span>{brand.coverage.state} ({brand.coverage.primaryCities.join(", ")})</span>
            </div>
          </div>

          {/* PROFESIONALES */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-accent">
              Para Profesionales
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Registrar mi servicio
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Acceso a mi panel
                </Link>
              </li>
              <li>
                <Link href="/panel/suscripcion" className="hover:text-white transition-colors">
                  Planes y beneficios
                </Link>
              </li>
            </ul>
          </div>

          {/* SOPORTE */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-accent">
              Contacto y Soporte
            </h4>
            <p className="text-xs sm:text-sm text-slate-300">
              ¿Dudas o soporte con tu perfil?
            </p>
            <a
              href={`mailto:${brand.contact.supportEmail}`}
              className="text-xs font-bold text-brand-surface-soft hover:underline block break-all"
            >
              {brand.contact.supportEmail}
            </a>
          </div>
        </div>

        {/* COPYRIGHT Y ENLACES LEGALES */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {currentYear} {brand.name}. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-3 font-medium text-slate-300">
            <Link href="/terminos" className="hover:text-white hover:underline transition-colors">
              Términos y Condiciones
            </Link>
            <span>•</span>
            <Link href="/privacidad" className="hover:text-white hover:underline transition-colors">
              Política de Privacidad
            </Link>
          </div>
          <p>
            Desarrollado para el crecimiento del trabajo técnico en {brand.coverage.state}.
          </p>
        </div>
      </div>
    </footer>
  );
}
