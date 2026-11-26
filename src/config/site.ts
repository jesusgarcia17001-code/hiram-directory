/**
 * Configuración general del sitio y entorno.
 */

import { brand } from "./brand";

function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  // Si se configuró explícitamente una URL válida (ej. dominio de staging en HTTPS) y no es localhost, usarla.
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl.replace(/\/+$/, "");
  }

  // En cualquier otro caso (producción, builds locales o sin variable),
  // usar SIEMPRE el dominio oficial en HTTPS (https://www.ofirservicios.com)
  // para evitar de raíz que Google Search Console rechace el sitemap o indexe localhost.
  return "https://www.ofirservicios.com";
}

export const site = {
  url: resolveSiteUrl(),
  defaultLocale: "es-VE",
  defaultRegion: brand.coverage.state,
  defaultTitle: `${brand.name} | ${brand.tagline}`,
  defaultDescription: brand.description,
} as const;

export type SiteConfig = typeof site;
