/**
 * Configuración general del sitio y entorno.
 */

import { brand } from "./brand";

export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.ofirservicios.com",
  defaultLocale: "es-VE",
  defaultRegion: brand.coverage.state,
  defaultTitle: `${brand.name} | ${brand.tagline}`,
  defaultDescription: brand.description,
} as const;

export type SiteConfig = typeof site;
