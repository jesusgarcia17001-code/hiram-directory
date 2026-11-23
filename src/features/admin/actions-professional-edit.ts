"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  VENEZUELA_PHONE_REGEX,
  normalizePhoneToE164,
  slugify,
} from "@/lib/validations/profile";
import type { Database, ProfessionalStatus } from "@/types/database";

type ProfessionalUpdate = Database["public"]["Tables"]["professionals"]["Update"];

export interface AdminEditActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

const adminEditSchema = z.object({
  professional_id: z.string().uuid("ID de profesional inválido."),
  business_name: z
    .string()
    .trim()
    .min(2, "El nombre comercial debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede superar los 120 caracteres."),
  locality_id: z.string().uuid("Selecciona una localidad válida de Anzoátegui."),
  category_id: z.string().uuid("Selecciona una categoría de oficio válida."),
  experience_years: z.coerce
    .number({ error: "Ingresa los años de experiencia." })
    .int("Debe ser un número entero.")
    .min(0, "No puede ser menor a 0.")
    .max(80, "No puede superar 80 años."),
  whatsapp_phone: z
    .string()
    .trim()
    .transform((val) => normalizePhoneToE164(val))
    .refine(
      (val) => VENEZUELA_PHONE_REGEX.test(val),
      "Ingresa un número de WhatsApp venezolano válido (ej: 0414-1234567 o +584141234567)."
    ),
  phone: z
    .string()
    .trim()
    .transform((val) => normalizePhoneToE164(val))
    .refine(
      (val) => val === "" || VENEZUELA_PHONE_REGEX.test(val),
      "Ingresa un número de llamadas válido (+58...) o déjalo vacío."
    )
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(3000, "La descripción no puede superar los 3000 caracteres.")
    .optional()
    .or(z.literal("")),
  status: z
    .enum(["pending", "approved", "rejected", "suspended"] as const)
    .optional(),
});

export async function adminUpdateProfessionalAction(
  _prevState: AdminEditActionResult | null,
  formData: FormData
): Promise<AdminEditActionResult> {
  const supabase = await createClient();

  // 1. Verificar autenticación del usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "No autenticado." };
  }

  // 2. Verificar rol de administrador
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userProfile || userProfile.role !== "admin") {
    return {
      success: false,
      message: "Acceso denegado: Se requieren permisos de administrador.",
    };
  }

  // 3. Extraer y validar campos
  const rawData = {
    professional_id: formData.get("professional_id"),
    business_name: formData.get("business_name"),
    locality_id: formData.get("locality_id"),
    category_id: formData.get("category_id"),
    experience_years: formData.get("experience_years"),
    whatsapp_phone: formData.get("whatsapp_phone"),
    phone: formData.get("phone") || "",
    description: formData.get("description") || "",
    status: formData.get("status") || undefined,
  };

  const parsed = adminEditSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Por favor corrige los datos del formulario.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const adminClient = createAdminClient();

  // 4. Consultar profesional existente
  const { data: existingProf, error: fetchErr } = await adminClient
    .from("professionals")
    .select("id, slug, business_name, locality_id, status")
    .eq("id", data.professional_id)
    .single();

  if (fetchErr || !existingProf) {
    return {
      success: false,
      message: `Profesional no encontrado: ${fetchErr?.message || "ID inexistente"}`,
    };
  }

  // 5. Manejar slug si cambió el nombre comercial
  let newSlug = existingProf.slug;
  if (data.business_name !== existingProf.business_name) {
    const baseSlug = slugify(data.business_name);
    if (baseSlug && baseSlug !== existingProf.slug) {
      const { data: slugTaken } = await adminClient
        .from("professionals")
        .select("id")
        .eq("slug", baseSlug)
        .neq("id", existingProf.id)
        .maybeSingle();

      newSlug = slugTaken
        ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
        : baseSlug;
    }
  }

  // 6. Actualizar registro en professionals
  const updatePayload: ProfessionalUpdate = {
    business_name: data.business_name,
    slug: newSlug,
    locality_id: data.locality_id,
    experience_years: data.experience_years,
    description: data.description || null,
    updated_at: new Date().toISOString(),
  };

  if (data.status) {
    updatePayload.status = data.status;
  }

  const { error: updateProfErr } = await adminClient
    .from("professionals")
    .update(updatePayload)
    .eq("id", data.professional_id);

  if (updateProfErr) {
    return {
      success: false,
      message: `Error al actualizar perfil: ${updateProfErr.message}`,
    };
  }

  // 7. Actualizar contactos (professional_contacts)
  const { error: contactsErr } = await adminClient
    .from("professional_contacts")
    .upsert(
      {
        professional_id: data.professional_id,
        whatsapp_phone: data.whatsapp_phone,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "professional_id" }
    );

  if (contactsErr) {
    return {
      success: false,
      message: `Error al actualizar números de contacto: ${contactsErr.message}`,
    };
  }

  // 8. Actualizar categoría de oficio principal (professional_categories)
  await adminClient
    .from("professional_categories")
    .delete()
    .eq("professional_id", data.professional_id);

  const { error: catErr } = await adminClient
    .from("professional_categories")
    .insert({
      professional_id: data.professional_id,
      category_id: data.category_id,
    });

  if (catErr) {
    return {
      success: false,
      message: `Error al asignar categoría: ${catErr.message}`,
    };
  }

  // 9. Registrar auditoría en audit_logs
  try {
    await adminClient.from("audit_logs").insert({
      actor_id: user.id,
      action: "admin_update_professional",
      entity_type: "professional",
      entity_id: data.professional_id,
      details: {
        previous_name: existingProf.business_name,
        new_name: data.business_name,
        new_slug: newSlug,
        updated_by: user.email || user.id,
      },
    });
  } catch {
    // Si falla el log de auditoría no bloqueamos la actualización
  }

  // 10. Revalidar rutas afectadas
  revalidatePath("/admin");
  revalidatePath("/admin/profesionales");
  revalidatePath(`/admin/profesionales/${data.professional_id}`);
  revalidatePath("/sitemap.xml");

  return {
    success: true,
    message: `Ficha de "${data.business_name}" actualizada exitosamente.`,
  };
}
