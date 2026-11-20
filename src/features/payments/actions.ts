"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { uploadReceiptFile, getSignedReceiptUrl } from "@/services/payments";

const paymentFormSchema = z.object({
  professional_id: z.string().uuid("ID de profesional inválido"),
  plan_id: z.string().uuid("ID de plan inválido"),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  payment_method: z.string().min(2, "Selecciona un método de pago"),
  reference_number: z
    .string()
    .trim()
    .min(3, "Ingresa un número de referencia válido (mínimo 3 caracteres)")
    .max(50, "La referencia es demasiado larga"),
});

export interface SubmitPaymentResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Server Action para registrar un nuevo pago manual con comprobante.
 */
export async function submitPaymentAction(
  prevState: SubmitPaymentResult | null,
  formData: FormData
): Promise<SubmitPaymentResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Debes iniciar sesión para reportar un pago.",
    };
  }

  const rawData = {
    professional_id: formData.get("professional_id"),
    plan_id: formData.get("plan_id"),
    amount: formData.get("amount"),
    payment_method: formData.get("payment_method"),
    reference_number: formData.get("reference_number"),
  };

  const parsed = paymentFormSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Por favor corrige los datos del formulario.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const file = formData.get("receipt_file") as File | null;
  if (!file || file.size === 0) {
    return {
      success: false,
      message: "Debes adjuntar el comprobante o captura de la transferencia/pago móvil.",
      errors: {
        receipt_file: ["El comprobante es obligatorio"],
      },
    };
  }

  try {
    // 1. Subir comprobante al bucket privado
    const uploadResult = await uploadReceiptFile(parsed.data.professional_id, file);

    // 2. Invocar RPC seguro en Supabase
    const { data, error } = await supabase.rpc("submit_manual_payment", {
      p_professional_id: parsed.data.professional_id,
      p_plan_id: parsed.data.plan_id,
      p_amount: parsed.data.amount,
      p_payment_method: parsed.data.payment_method,
      p_reference_number: parsed.data.reference_number,
      p_receipt_storage_path: uploadResult.storagePath,
      p_receipt_mime_type: uploadResult.mimeType,
      p_receipt_size_bytes: uploadResult.sizeBytes,
    });

    if (error) {
      return {
        success: false,
        message: `Error al registrar pago: ${error.message}`,
      };
    }

    revalidatePath("/panel");
    revalidatePath("/panel/suscripcion");
    revalidatePath("/admin/pagos");

    return {
      success: true,
      message: "¡Comprobante enviado exitosamente! Un administrador verificará tu pago y activará tu plan.",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Ocurrió un error inesperado al procesar el pago.",
    };
  }
}

export interface ReviewPaymentResult {
  success: boolean;
  message?: string;
}

/**
 * Server Action para que el administrador apruebe o rechace un pago.
 */
export async function reviewPaymentAction(formData: FormData): Promise<ReviewPaymentResult> {
  const supabase = await createClient();

  const paymentId = formData.get("payment_id") as string;
  const decision = formData.get("decision") as "approved" | "rejected";
  const reason = (formData.get("rejection_reason") as string) || "";

  if (!paymentId || !decision) {
    return {
      success: false,
      message: "Parámetros de revisión incompletos.",
    };
  }

  if (decision === "rejected" && reason.trim().length < 3) {
    return {
      success: false,
      message: "Debes especificar un motivo claro para rechazar el pago.",
    };
  }

  const { data, error } = await supabase.rpc("admin_review_payment", {
    p_payment_id: paymentId,
    p_decision: decision,
    p_rejection_reason: decision === "rejected" ? reason.trim() : null,
  });

  if (error) {
    return {
      success: false,
      message: `Error al revisar pago: ${error.message}`,
    };
  }

  revalidatePath("/admin/pagos");
  revalidatePath("/admin");
  revalidatePath("/panel");
  revalidatePath("/panel/suscripcion");

  return {
    success: true,
    message:
      decision === "approved"
        ? "¡Pago aprobado con éxito! La suscripción ha sido activada y los contactos desbloqueados."
        : "El pago ha sido rechazado y se registró el motivo.",
  };
}

/**
 * Server Action para obtener una URL firmada de visualización de comprobante.
 */
export async function getReceiptUrlAction(storagePath: string): Promise<string | null> {
  return await getSignedReceiptUrl(storagePath);
}
