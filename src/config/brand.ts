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

  // Paleta de colores base (tokens de referencia alineados con variables CSS)
  colors: {
    primary: "#1d4ed8", // Azul confiable (servicios profesionales)
    primaryHover: "#1e40af",
    secondary: "#0f172a", // Pizarra oscuro institucional
    accent: "#f59e0b", // Ámbar de acción/atención
    success: "#16a34a",
    danger: "#dc2626",
    surface: "#ffffff",
    surfaceMuted: "#f8fafc",
    textPrimary: "#0f172a",
    textMuted: "#64748b",
  },

  // Contacto y soporte institucional
  contact: {
    supportEmail: "soporte@hiramdirectory.com",
  },
} as const;

export type BrandConfig = typeof brand;
