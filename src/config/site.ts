/**
 * Configuración general del sitio y entorno.
 */

import { brand } from "./brand";

function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  // En producción (Vercel) o si la URL de entorno es localhost/inválida,
  // usar SIEMPRE el dominio oficial en HTTPS para evitar que Google rechace el sitemap.
  if (
    process.env.NODE_ENV === "production" ||
    (envUrl && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")))
  ) {
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl.replace(/\/+$/, "");
    }
    return "https://www.ofirservicios.com";
  }

  return envUrl ? envUrl.replace(/\/+$/, "") : "http://localhost:3000";
}

export const site = {
  url: resolveSiteUrl(),
  defaultLocale: "es-VE",
  defaultRegion: brand.coverage.state,
  defaultTitle: `${brand.name} | ${brand.tagline}`,
  defaultDescription: brand.description,
} as const;

export type SiteConfig = typeof site;
