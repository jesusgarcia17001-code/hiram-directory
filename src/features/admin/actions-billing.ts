"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface BillingActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Server Action: Cambiar estado de cobro / modo lanzamiento (Solo Admin).
 */
export async function setBillingEnabledAction(
  _prevState: BillingActionResult | null,
  formData: FormData
): Promise<BillingActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "No autenticado." };
  }

  // Verificar que el usuario sea administrador
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, message: "No tienes permisos de administrador." };
  }

  const enabledStr = formData.get("enabled");
  const targetEnabled = enabledStr === "true";

  // Si se va a activar el cobro, exigir confirmación explícita con la palabra "ACTIVAR"
  if (targetEnabled) {
    const confirmation = formData.get("confirmation")?.toString().trim();
    if (confirmation !== "ACTIVAR") {
      return {
        success: false,
        message: "Para activar el cobro debes escribir exactamente la palabra ACTIVAR en mayúsculas.",
        errors: { confirmation: ["Escribe exactamente ACTIVAR para confirmar."] },
      };
    }
  }

  const bannerText = formData.get("banner_text")?.toString().trim() || null;
  const bannerEnabled = formData.get("banner_enabled") === "true";

  try {
    const { data, error } = await supabase.rpc("admin_set_billing_enabled", {
      p_enabled: targetEnabled,
      p_banner_text: bannerText,
      p_banner_enabled: bannerEnabled,
    });

    if (error) {
      return { success: false, message: `Error al actualizar: ${error.message}` };
    }

    revalidatePath("/admin/ajustes-pago");
    revalidatePath("/panel");
    revalidatePath("/panel/suscripcion");
    revalidatePath("/");

    const res = data as { success?: boolean; billing_enabled?: boolean; message?: string };
    const stateMessage = targetEnabled
      ? "Cobro activado exitosamente. Rigen las cuotas gratuitas y las suscripciones."
      : "Modo lanzamiento gratuito activado. Los contactos son ilimitados y no se cobran suscripciones.";

    return {
      success: true,
      message: res?.message || stateMessage,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error inesperado";
    return { success: false, message: msg };
  }
}
