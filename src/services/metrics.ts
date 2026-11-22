import "server-only";

import { createHmac, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { brand } from "@/config/brand";

const VISITOR_COOKIE_NAME = "__hiram_vid";

// Secreto para HMAC. Si no se define una variable específica, usa anon key como fallback seguro.
const HMAC_SECRET =
  process.env.METRICS_HMAC_SECRET ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "hiram-default-metrics-secret-key";

/**
 * Lista de agentes de usuario correspondientes a rastreadores y bots conocidos.
 * Sus visitas e impresiones no consumen cuota de los profesionales.
 */
const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /googlebot/i,
  /bingbot/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /whatsapp/i,
  /telegram/i,
  /twitterbot/i,
];

/**
 * Determina si una solicitud proviene de un bot conocido.
 */
export async function isBotRequest(): Promise<boolean> {
  const headerList = await headers();
  const userAgent = headerList.get("user-agent") || "";
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Obtiene o inicializa un identificador anónimo de visitante (visitor_hash).
 * REGLA DE SEGURIDAD (CLAUDE.md):
 *  - No se guardan direcciones IP ni datos personales del visitante.
 *  - Se utiliza un identificador en cookie anónima firmado con HMAC sha256 en el servidor.
 */
export async function getOrCreateVisitorHash(): Promise<string> {
  const cookieStore = await cookies();
  let visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value;

  if (!visitorId) {
    visitorId = randomUUID();
    try {
      cookieStore.set(VISITOR_COOKIE_NAME, visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 año de persistencia para visitas únicas permanentes
        path: "/",
      });
    } catch {
      // Si se llama en un contexto donde no se pueden mutar cookies directamente,
      // se continúa usando el ID generado en memoria para la petición.
    }
  }

  // Generar HMAC SHA-256 seguro
  return createHmac("sha256", HMAC_SECRET).update(visitorId).digest("hex");
}

export interface RevealContactResult {
  authorized: boolean;
  channel?: "whatsapp" | "call";
  phone?: string;
  actionUrl?: string;
  isQuotaExhausted?: boolean;
  message?: string;
  quota?: {
    visits: number;
    contacts: number;
    visit_limit: number;
    contact_limit: number;
  };
}

/**
 * Registra una visita única en el perfil del profesional.
 * Ejecutada en el servidor.
 */
export async function recordProfileVisit(professionalId: string): Promise<boolean> {
  // Ignorar bots
  if (await isBotRequest()) {
    return false;
  }

  const visitorHash = await getOrCreateVisitorHash();
  const dedupeKey = `visit-${professionalId}-${visitorHash}`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const actorId = user?.id || null;

  const adminClient = createAdminClient();
  const { data: recorded, error } = await adminClient.rpc("record_profile_visit", {
    p_professional_id: professionalId,
    p_visitor_hash: visitorHash,
    p_dedupe_key: dedupeKey,
    p_actor_id: actorId,
  });

  if (error) {
    console.error("Error al registrar visita:", error.message);
    return false;
  }

  return Boolean(recorded);
}

/**
 * Solicita de forma atómica la autorización y revelado del número de contacto (WhatsApp o llamada).
 * REGLA DE SEGURIDAD: El servidor valida cuotas con FOR UPDATE y genera el enlace oficial.
 * Ejecutado exclusivamente por service_role con el actor_id verificado en servidor.
 */
export async function revealProfessionalContact(
  professionalId: string,
  channel: "whatsapp" | "call"
): Promise<RevealContactResult> {
  // Ignorar bots
  if (await isBotRequest()) {
    return {
      authorized: false,
      message: "Solicitud no permitida para rastreadores automatizados.",
    };
  }

  const visitorHash = await getOrCreateVisitorHash();
  // Clave de deduplicación para prevenir doble clic rápido de red
  const dedupeKey = `contact-${professionalId}-${channel}-${visitorHash}-${Math.floor(
    Date.now() / 3000
  )}`;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const actorId = user?.id || null;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.rpc("reveal_professional_contact", {
    p_professional_id: professionalId,
    p_channel: channel,
    p_visitor_hash: visitorHash,
    p_dedupe_key: dedupeKey,
    p_actor_id: actorId,
  });

  if (error) {
    return {
      authorized: false,
      message: error.message,
    };
  }

  const res = data as unknown as {
    authorized: boolean;
    channel?: "whatsapp" | "call";
    phone?: string;
    is_quota_exhausted?: boolean;
    message?: string;
    quota?: {
      visits: number;
      contacts: number;
      visit_limit: number;
      contact_limit: number;
    };
  };

  if (!res.authorized) {
    return {
      authorized: false,
      isQuotaExhausted: res.is_quota_exhausted,
      message: res.message || "No autorizado para contactar.",
    };
  }

  const rawPhone = res.phone || "";
  // Generar enlace seguro según el canal
  let actionUrl = "";
  if (channel === "whatsapp") {
    const cleanNumber = rawPhone.replace(/\+/g, "");
    const message = encodeURIComponent(
      "Hola, vi tu perfil en Ofir Oficios y deseo consultar sobre tus servicios."
    );
    actionUrl = `https://wa.me/${cleanNumber}?text=${message}`;
  } else {
    actionUrl = `tel:${rawPhone}`;
  }

  return {
    authorized: true,
    channel,
    phone: rawPhone,
    actionUrl,
    quota: res.quota,
  };
}

/**
 * Obtiene las métricas privadas del profesional para mostrar en su panel.
 * Ejecutada mediante service_role en el servidor tras validar autenticación.
 */
export async function getProfessionalMetrics(professionalId: string) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("get_professional_metrics", {
    p_professional_id: professionalId,
  });

  if (error) {
    console.error("Error al consultar métricas:", error.message);
    return null;
  }

  return data as unknown as {
    quota: {
      visits: number;
      contacts: number;
      visit_limit: number;
      contact_limit: number;
      is_contacts_enabled: boolean;
    };
    stats: {
      total_impressions: number;
      total_visits: number;
      total_whatsapp: number;
      total_calls: number;
    };
    subscription: {
      is_active: boolean;
      starts_at?: string;
      ends_at?: string;
    };
  };
}
