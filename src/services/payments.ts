import "server-only";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

export interface PlanItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  duration_days: number;
  features: {
    contact_buttons?: string;
    statistics?: string;
    max_photos?: number;
    featured?: boolean;
    promotions?: boolean;
    [key: string]: unknown;
  };
  sort_order: number;
}

export interface PaymentItem {
  id: string;
  professional_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  receipt?: {
    storage_path: string;
    mime_type: string;
    size_bytes: number;
  } | null;
  plan?: {
    name: string;
    duration_days: number;
  } | null;
  professional?: {
    business_name: string;
    slug: string;
  } | null;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Obtiene la lista de planes activos ordenados.
 */
export async function getActivePlans(): Promise<PlanItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("plans")
    .select("id, name, slug, description, price, currency, duration_days, features, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error al obtener planes:", error.message);
    return [];
  }

  return (data || []).map((p) => ({
    ...p,
    features: (typeof p.features === "object" && p.features !== null ? p.features : {}) as PlanItem["features"],
  }));
}

/**
 * Obtiene el historial de pagos y la suscripción de un profesional.
 */
export async function getProfessionalSubscriptionInfo(professionalId: string) {
  const supabase = await createClient();

  // 1. Suscripción activa o última
  const { data: subData } = await supabase
    .from("subscriptions")
    .select("id, plan_id, status, starts_at, ends_at, created_at")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Historial de pagos
  const { data: paymentsData, error: paymentsError } = await supabase
    .from("payments")
    .select(
      `
      id,
      professional_id,
      subscription_id,
      amount,
      currency,
      payment_method,
      reference_number,
      status,
      reviewed_by,
      reviewed_at,
      rejection_reason,
      created_at,
      payment_receipts (
        storage_path,
        mime_type,
        size_bytes
      )
    `
    )
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  if (paymentsError) {
    console.error("Error al obtener pagos:", paymentsError.message);
  }

  const payments: PaymentItem[] = (paymentsData || []).map((p) => {
    const rawReceipt = Array.isArray(p.payment_receipts)
      ? p.payment_receipts[0]
      : p.payment_receipts;

    return {
      id: p.id,
      professional_id: p.professional_id,
      subscription_id: p.subscription_id,
      amount: p.amount,
      currency: p.currency,
      payment_method: p.payment_method,
      reference_number: p.reference_number,
      status: p.status,
      reviewed_by: p.reviewed_by,
      reviewed_at: p.reviewed_at,
      rejection_reason: p.rejection_reason,
      created_at: p.created_at,
      receipt: rawReceipt || null,
    };
  });

  // Determinar si la suscripción está realmente vigente por fecha
  const isCurrentlyActive = Boolean(
    subData &&
      subData.status === "active" &&
      subData.starts_at &&
      subData.ends_at &&
      new Date(subData.ends_at).getTime() > Date.now()
  );

  return {
    subscription: subData
      ? {
          ...subData,
          isCurrentlyActive,
        }
      : null,
    payments,
  };
}

/**
 * Consulta para administradores: lista todos los pagos con datos del profesional y plan.
 */
export async function getPaymentsForAdmin(statusFilter?: "pending" | "approved" | "rejected") {
  const supabase = await createClient();

  let query = supabase
    .from("payments")
    .select(
      `
      id,
      professional_id,
      subscription_id,
      amount,
      currency,
      payment_method,
      reference_number,
      status,
      reviewed_by,
      reviewed_at,
      rejection_reason,
      created_at,
      professionals (
        business_name,
        slug
      ),
      subscriptions (
        plan_id,
        plans (
          name,
          duration_days
        )
      ),
      payment_receipts (
        storage_path,
        mime_type,
        size_bytes
      )
    `
    )
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener pagos para admin:", error.message);
    return [];
  }

  return (data || []).map((p: any) => {
    const rawReceipt = Array.isArray(p.payment_receipts)
      ? p.payment_receipts[0]
      : p.payment_receipts;
    const rawSub = Array.isArray(p.subscriptions) ? p.subscriptions[0] : p.subscriptions;
    const rawPlan = rawSub?.plans
      ? Array.isArray(rawSub.plans)
        ? rawSub.plans[0]
        : rawSub.plans
      : null;
    const rawProf = Array.isArray(p.professionals)
      ? p.professionals[0]
      : p.professionals;

    return {
      id: p.id,
      professional_id: p.professional_id,
      subscription_id: p.subscription_id,
      amount: p.amount,
      currency: p.currency,
      payment_method: p.payment_method,
      reference_number: p.reference_number,
      status: p.status,
      reviewed_by: p.reviewed_by,
      reviewed_at: p.reviewed_at,
      rejection_reason: p.rejection_reason,
      created_at: p.created_at,
      receipt: rawReceipt || null,
      plan: rawPlan || null,
      professional: rawProf || null,
    } as PaymentItem;
  });
}

/**
 * Genera un enlace firmado temporal (5 minutos) para ver un comprobante privado.
 * REGLA DE SEGURIDAD (CLAUDE.md):
 *  - Los comprobantes residen en un bucket privado ("payment-receipts").
 *  - Solo se accede mediante URL firmada de corta duración.
 */
export async function getSignedReceiptUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("payment-receipts")
    .createSignedUrl(storagePath, 300); // 300 segundos = 5 minutos

  if (error || !data?.signedUrl) {
    console.error("Error al generar URL firmada de comprobante:", error?.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Valida y sube un comprobante al bucket privado "payment-receipts".
 */
export async function uploadReceiptFile(
  professionalId: string,
  file: File
): Promise<{ storagePath: string; mimeType: string; sizeBytes: number }> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      "Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) o documentos PDF."
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("El archivo supera el tamaño máximo permitido de 5 MB.");
  }

  const supabase = await createClient();

  // Extension
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const uniqueName = `${randomUUID()}.${extension}`;
  // Ruta obligatoria por política RLS: {professional_id}/{archivo}
  const storagePath = `${professionalId}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-receipts")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error al subir el comprobante: ${uploadError.message}`);
  }

  return {
    storagePath,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}
