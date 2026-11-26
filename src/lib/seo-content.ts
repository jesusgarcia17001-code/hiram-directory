import { brand } from "@/config/brand";

/**
 * Utilidades centralizadas para optimización SEO según directrices de Semrush y Schema.org.
 */

const BRAND_SUFFIX = ` | ${brand.name}`;
const MAX_TITLE_LENGTH = 60;
const MAX_INNER_TITLE_LENGTH = MAX_TITLE_LENGTH - BRAND_SUFFIX.length; // 60 - 17 = 43

/**
 * Genera el título para la página de categoría general (/[categoria]).
 * Garantiza que con el template de layout ("%s | Marca") nunca supere 60 caracteres.
 */
export function buildCategoryTitle(pluralLabel: string): string {
  const withState = `${pluralLabel} en Anzoátegui`;
  if (withState.length <= MAX_INNER_TITLE_LENGTH) {
    return withState;
  }
  if (pluralLabel.length <= MAX_INNER_TITLE_LENGTH) {
    return pluralLabel;
  }
  return pluralLabel.slice(0, MAX_INNER_TITLE_LENGTH).trim();
}

/**
 * Genera el título para la página de categoría + localidad (/[categoria]/[localidad]).
 * Retorna un string para el template o un objeto { absolute } si se requiere control exacto.
 */
export function buildLocalityCategoryTitle(
  pluralLabel: string,
  localityName: string
): { title: string; absolute?: string } {
  const baseTitle = `${pluralLabel} en ${localityName}`;

  if (baseTitle.length <= MAX_INNER_TITLE_LENGTH) {
    return { title: baseTitle };
  }

  // Si excede el espacio del template, armamos un título absoluto compacto <= 60 chars
  const shortPlural = pluralLabel
    .replace(/^Técnicos de /i, "")
    .replace(/^Especialistas en /i, "");
  const compactTitle = `${shortPlural} en ${localityName}${BRAND_SUFFIX}`;

  if (compactTitle.length <= MAX_TITLE_LENGTH) {
    return { title: compactTitle, absolute: compactTitle };
  }

  // Truncado de seguridad absoluto garantizando <= 60 caracteres
  const maxContentLength = MAX_TITLE_LENGTH - BRAND_SUFFIX.length - 3;
  const safeTitle = `${baseTitle.slice(0, maxContentLength).trim()}...${BRAND_SUFFIX}`;
  return { title: safeTitle, absolute: safeTitle };
}

/**
 * Genera el título absoluto para el perfil individual de un profesional.
 * Garantiza estrictamente que no supere 60 caracteres totales.
 */
export function buildProfileTitle(
  businessName: string,
  singularLabel: string,
  localityName?: string
): string {
  // Opción 1: Negocio - Oficio | Marca
  const opt1 = `${businessName} - ${singularLabel}${BRAND_SUFFIX}`;
  if (opt1.length <= MAX_TITLE_LENGTH) {
    return opt1;
  }

  // Opción 2: Negocio (Ciudad) | Marca
  if (localityName) {
    const opt2 = `${businessName} (${localityName})${BRAND_SUFFIX}`;
    if (opt2.length <= MAX_TITLE_LENGTH) {
      return opt2;
    }
  }

  // Opción 3: Negocio | Marca
  const opt3 = `${businessName}${BRAND_SUFFIX}`;
  if (opt3.length <= MAX_TITLE_LENGTH) {
    return opt3;
  }

  // Truncado de seguridad con elipsis
  const maxNameLength = MAX_TITLE_LENGTH - BRAND_SUFFIX.length - 3;
  return `${businessName.slice(0, maxNameLength).trim()}...${BRAND_SUFFIX}`;
}

/**
 * Genera un texto introductorio contextualizado de entre 80 y 150 palabras.
 * Proporciona información real sobre el oficio y la zona sin inventar métricas falsas.
 */
export function generateCategoryIntroText(
  categoryName: string,
  localityName?: string
): string {
  const location = localityName
    ? `${localityName} y zonas vecinas`
    : "Puerto La Cruz, Barcelona, Lechería y todo el estado Anzoátegui";

  return `Encuentra técnicos calificados y prestadores de servicios de ${categoryName.toLowerCase()} con atención directa en ${location}. En nuestra región, factores como las altas temperaturas, la salinidad en zonas costeras y las fluctuaciones del suministro eléctrico exigen un mantenimiento constante y una instalación profesional de los sistemas del hogar o comercio. Este directorio conecta a usuarios con especialistas verificados para reparaciones oportunas, instalaciones certificadas y revisiones preventivas. Puedes revisar los servicios de cada ficha, ver fotografías de trabajos previos y comunicarte directamente con el profesional por WhatsApp o llamada telefónica sin comisiones ni intermediarios en tu contratación.`;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Genera 3 preguntas frecuentes visibles y útiles para la página de oficio o localidad.
 */
export function generateCategoryFaqs(
  categorySingular: string,
  localityName?: string
): FaqItem[] {
  const loc = localityName || "el estado Anzoátegui";

  return [
    {
      question: `¿Cómo contacto a un especialista de ${categorySingular.toLowerCase()} en ${loc}?`,
      answer: `Revisa los perfiles listados, compara su experiencia y especialidades, y presiona el botón de contacto para abrir una conversación directa por WhatsApp o realizar una llamada telefónica inmediata con el técnico.`,
    },
    {
      question: "¿La plataforma cobra alguna comisión o tarifa a los clientes?",
      answer: `No. El uso del directorio es 100% gratuito para el público. Los acuerdos de presupuesto, formas de pago y plazos de entrega se coordinan directamente entre tú y el profesional.`,
    },
    {
      question: `¿Qué información debo indicarle al profesional al solicitar una cotización?`,
      answer: `Para recibir una respuesta precisa, describe claramente el problema o requerimiento, indica tu sector o dirección en ${loc}, y si es posible, envía fotos o videos breves de la falla o área de trabajo por WhatsApp.`,
    },
  ];
}
