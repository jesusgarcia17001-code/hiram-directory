"use server";

import { revealProfessionalContact, RevealContactResult } from "@/services/metrics";

export interface ContactActionResult {
  success: boolean;
  data?: RevealContactResult;
  error?: string;
}

export async function revealContactAction(
  professionalId: string,
  channel: "whatsapp" | "call"
): Promise<ContactActionResult> {
  if (!professionalId || !channel) {
    return {
      success: false,
      error: "Parámetros incompletos para solicitar contacto.",
    };
  }

  try {
    const result = await revealProfessionalContact(professionalId, channel);
    if (!result.authorized) {
      return {
        success: false,
        data: result,
        error: result.message || "Límite de contactos alcanzado.",
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error inesperado al solicitar contacto.";
    return {
      success: false,
      error: message,
    };
  }
}
