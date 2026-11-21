/**
 * Configuración central de marca del proyecto.
 * REGLA PERMANENTE (CLAUDE.md):
 * Todo lo relacionado con marca (nombre, logo, colores, tipografías, eslogan)
 * vive SOLO en este archivo y en variables CSS.
 * NUNCA escribir el nombre de marca a mano en componentes.
 */

export const brand = {
  // Identidad
  name: "HIRAM Directory",
  shortName: "HIRAM",
  owner: "HIRAM",
  tagline: "Directorio de técnicos y servicios profesionales en Anzoátegui",
  description:
    "Encuentra técnicos certificados y prestadores de servicios de confianza en Puerto La Cruz, Barcelona y todo el estado Anzoátegui.",

  // Cobertura inicial
  coverage: {
    state: "Anzoátegui",
    primaryCities: ["Puerto La Cruz", "Barcelona"],
    country: "Venezuela",
  },

  // Logotipo e isotipo (referencias a public/)
  logo: {
    text: "HIRAM",
    symbol: "/icons/icon-192.png",
    favicon: "/favicon.ico",
  },

  // Paleta de colores oficial (Fase 8, Paso 0)
  colors: {
    primary: "#0B2A5B", // Azul marino institucional
    primaryDark: "#081E42", // Azul marino profundo
    secondary: "#081E42",
    accent: "#F97316", // Naranja vibrante de acción
    accentDark: "#C2410C", // Naranja oscuro para texto/enlaces con contraste WCAG AA
    surfaceSoft: "#EAF0FA", // Azul grisáceo suave para chips y fondos
    surface: "#FFFFFF",
    surfaceMuted: "#EAF0FA",
    textPrimary: "#081E42",
    textMuted: "#475569",
    white: "#FFFFFF",
    success: "#16a34a",
    danger: "#dc2626",
  },

  // Contacto y soporte institucional
  contact: {
    supportEmail: "soporte@hiramdirectory.com",
  },
} as const;

export type BrandConfig = typeof brand;
