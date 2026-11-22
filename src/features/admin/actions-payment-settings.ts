"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const paymentSettingsSchema = z.object({
  bank_name: z.string().trim().min(2, "El nombre del banco es requerido"),
  bank_code: z.string().trim().regex(/^\d{4}$/, "El código de banco debe tener 4 dígitos (Ej: 0105)"),
  id_type: z.enum(["V", "E", "J", "G"], { message: "Selecciona un tipo de documento válido" }),
  id_number: z.string().trim().min(5, "El documento debe tener al menos 5 dígitos").max(12, "Documento demasiado largo"),
  phone: z.string().trim().min(10, "El teléfono debe tener formato válido (Ej: 04141234567 o +584141234567)"),
  account_holder: z.string().trim().min(3, "El nombre del titular es requerido"),
  instructions: z.string().trim().max(500, "Las instrucciones no deben superar los 500 caracteres").optional(),
});

export interface ActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Server Action: Guardar o actualizar los datos de Pago Móvil.
 */
export async function savePaymentSettingsAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "No autenticado" };
  }

  const rawData = {
    bank_name: formData.get("bank_name"),
    bank_code: formData.get("bank_code"),
    id_type: formData.get("id_type"),
    id_number: formData.get("id_number"),
    phone: formData.get("phone"),
    account_holder: formData.get("account_holder"),
    instructions: formData.get("instructions") || "",
  };

  const parsed = paymentSettingsSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Por favor corrige los datos del formulario.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { error } = await supabase
      .from("payment_settings")
      .upsert({
        id: "pago_movil",
        bank_name: parsed.data.bank_name,
        bank_code: parsed.data.bank_code,
        id_type: parsed.data.id_type,
        id_number: parsed.data.id_number,
        phone: parsed.data.phone,
        account_holder: parsed.data.account_holder,
        instructions: parsed.data.instructions || "",
        is_active: true,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      });

    if (error) {
      return { success: false, message: `Error al guardar: ${error.message}` };
    }

    // Registrar en auditoría
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "payment_settings.update",
      entity_type: "payment_settings",
      details: {
        bank_name: parsed.data.bank_name,
        bank_code: parsed.data.bank_code,
        id_type: parsed.data.id_type,
      },
    });

    revalidatePath("/admin/ajustes-pago");
    revalidatePath("/panel/suscripcion");

    return {
      success: true,
      message: "¡Datos de Pago Móvil actualizados exitosamente!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Ocurrió un error inesperado.",
    };
  }
}

/**
 * Server Action: Fijar una tasa manual por el administrador.
 */
export async function setManualRateAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const rateStr = formData.get("manual_rate") as string;
  const rateNum = Number(rateStr?.replace(",", "."));

  if (!Number.isFinite(rateNum) || rateNum <= 0) {
    return {
      success: false,
      message: "Por favor ingresa un número de tasa válido mayor a 0.",
    };
  }

  const { error } = await supabase.rpc("admin_set_manual_rate", {
    p_rate: rateNum,
  });

  if (error) {
    return { success: false, message: `Error al fijar tasa: ${error.message}` };
  }

  revalidatePath("/admin/ajustes-pago");
  revalidatePath("/panel/suscripcion");

  return {
    success: true,
    message: `Tasa manual fijada en ${rateNum.toFixed(2)} Bs / USD.`,
  };
}

/**
 * Server Action: Revertir a la última tasa automática de CotizaVE.
 */
export async function revertToAutomatedRateAction(): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_revert_to_automated_rate");

  if (error) {
    return {
      success: false,
      message: `Error al restaurar tasa automática: ${error.message}`,
    };
  }

  revalidatePath("/admin/ajustes-pago");
  revalidatePath("/panel/suscripcion");

  return {
    success: true,
    message: "Se ha restaurado la tasa oficial de CotizaVE exitosamente.",
  };
}

/**
 * Server Action: Aprobar o rechazar una tasa retenida por variación > 15%.
 */
export async function reviewPendingRateAction(
  rateId: string,
  decision: "approved" | "rejected"
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_review_pending_rate", {
    p_rate_id: rateId,
    p_decision: decision,
  });

  if (error) {
    return {
      success: false,
      message: `Error al procesar la tasa: ${error.message}`,
    };
  }

  revalidatePath("/admin/ajustes-pago");
  revalidatePath("/panel/suscripcion");

  return {
    success: true,
    message: decision === "approved" ? "Tasa aprobada y activada." : "Tasa rechazada.",
  };
}
