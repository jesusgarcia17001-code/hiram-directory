"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProfessionalStatus } from "@/types/database";

export interface AdminActionState {
  success: boolean;
  message?: string;
}

export async function updateProfessionalStatusAction(
  prevState: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "No autenticado.",
    };
  }

  // Verificación autoritativa de rol
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      success: false,
      message: "No tienes permisos de administrador.",
    };
  }

  const professionalId = formData.get("professional_id") as string;
  const status = formData.get("status") as ProfessionalStatus;
  const note = (formData.get("note") as string) || null;

  if (!professionalId || !status) {
    return {
      success: false,
      message: "Datos incompletos para actualizar el estado.",
    };
  }

  // Llamada a la función SQL de seguridad que actualiza y audita en audit_logs
  const { error } = await supabase.rpc("admin_set_professional_status", {
    p_professional_id: professionalId,
    p_status: status,
    p_note: note,
  });

  if (error) {
    return {
      success: false,
      message: `Error al actualizar estado: ${error.message}`,
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/profesionales");
  revalidatePath("/panel");

  return {
    success: true,
    message: `El perfil ha sido marcado como: "${status}" con éxito.`,
  };
}
