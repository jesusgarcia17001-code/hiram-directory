/**
 * Configuración general del sitio y entorno.
 */

import { brand } from "./brand";

export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  defaultLocale: "es-VE",
  defaultRegion: brand.coverage.state,
  defaultTitle: `${brand.name} | ${brand.tagline}`,
  defaultDescription: brand.description,
} as const;

export type SiteConfig = typeof site;
