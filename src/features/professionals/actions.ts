"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, slugify } from "@/lib/validations/profile";

export interface ProfileActionState {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export async function saveProfileAction(
  prevState: ProfileActionState | null,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Debes iniciar sesión para realizar esta acción.",
    };
  }

  // Extraer valores del formulario
  const rawData = {
    provider_type: formData.get("provider_type"),
    id_type: formData.get("id_type"),
    id_number: formData.get("id_number"),
    business_name: formData.get("business_name"),
    locality_id: formData.get("locality_id"),
    category_id: formData.get("category_id"),
    description: formData.get("description") || "",
    experience_years: formData.get("experience_years"),
    whatsapp_phone: formData.get("whatsapp_phone"),
    phone: formData.get("phone") || "",
    service_areas: formData.getAll("service_areas") as string[],
    contact_person_name: formData.get("contact_person_name") || "",
    instagram_handle: formData.get("instagram_handle") || "",
    tiktok_handle: formData.get("tiktok_handle") || "",
    facebook_url: formData.get("facebook_url") || "",
    website_url: formData.get("website_url") || "",
  };

  // Validar con Zod
  const parsed = profileSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Por favor corrige los campos indicados en el formulario.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Verificar si ya existe un perfil para este usuario
  const { data: existingProf, error: fetchError } = await supabase
    .from("professionals")
    .select("id, slug, status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return {
      success: false,
      message: `Error al consultar perfil: ${fetchError.message}`,
    };
  }

  let professionalId = existingProf?.id;

  if (existingProf) {
    // Si ya existe el perfil
    let slugToUpdate = existingProf.slug;

    // Solo si aún está pendiente de aprobación se permite regenerar el slug si cambió el nombre
    if (existingProf.status === "pending") {
      const baseSlug = slugify(data.business_name);
      if (baseSlug && baseSlug !== existingProf.slug) {
        const { data: slugTaken } = await supabase
          .from("professionals")
          .select("id")
          .eq("slug", baseSlug)
          .neq("id", existingProf.id)
          .maybeSingle();

        slugToUpdate = slugTaken
          ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
          : baseSlug;
      }
    }

    const { error: updateError } = await supabase
      .from("professionals")
      .update({
        business_name: data.business_name,
        slug: slugToUpdate,
        provider_type: data.provider_type,
        id_type: data.id_type,
        id_number: data.id_number,
        locality_id: data.locality_id,
        experience_years: data.experience_years,
        description: data.description || null,
        service_areas: data.service_areas,
        contact_person_name: data.contact_person_name || null,
        instagram_handle: data.instagram_handle || null,
        tiktok_handle: data.tiktok_handle || null,
        facebook_url: data.facebook_url || null,
        website_url: data.website_url || null,
      })
      .eq("id", existingProf.id);

    if (updateError) {
      return {
        success: false,
        message: `Error al actualizar datos del perfil: ${updateError.message}`,
      };
    }
  } else {
    // Si es un perfil nuevo
    const baseSlug = slugify(data.business_name);
    let finalSlug = baseSlug;

    // Verificar si el slug ya está en uso
    const { data: slugTaken } = await supabase
      .from("professionals")
      .select("id")
      .eq("slug", baseSlug)
      .maybeSingle();

    if (slugTaken) {
      finalSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { data: newProf, error: insertError } = await supabase
      .from("professionals")
      .insert({
        owner_id: user.id,
        business_name: data.business_name,
        slug: finalSlug,
        provider_type: data.provider_type,
        id_type: data.id_type,
        id_number: data.id_number,
        locality_id: data.locality_id,
        experience_years: data.experience_years,
        description: data.description || null,
        service_areas: data.service_areas,
        contact_person_name: data.contact_person_name || null,
        instagram_handle: data.instagram_handle || null,
        tiktok_handle: data.tiktok_handle || null,
        facebook_url: data.facebook_url || null,
        website_url: data.website_url || null,
      })
      .select("id")
      .single();

    if (insertError || !newProf) {
      return {
        success: false,
        message: `Error al crear el perfil: ${insertError?.message || "No se pudo registrar"}`,
      };
    }

    professionalId = newProf.id;
  }

  // Guardar teléfonos en professional_contacts
  const { error: contactError } = await supabase
    .from("professional_contacts")
    .upsert({
      professional_id: professionalId!,
      whatsapp_phone: data.whatsapp_phone,
      phone: data.phone || null,
      updated_at: new Date().toISOString(),
    });

  if (contactError) {
    return {
      success: false,
      message: `Perfil guardado, pero ocurrió un error con los teléfonos: ${contactError.message}`,
    };
  }

  // Actualizar categoría del profesional
  await supabase
    .from("professional_categories")
    .delete()
    .eq("professional_id", professionalId!);

  const { error: catError } = await supabase
    .from("professional_categories")
    .insert({
      professional_id: professionalId!,
      category_id: data.category_id,
    });

  if (catError) {
    return {
      success: false,
      message: `Perfil guardado, pero ocurrió un error al vincular la categoría: ${catError.message}`,
    };
  }

  revalidatePath("/panel");
  revalidatePath("/panel/perfil");

  return {
    success: true,
    message: existingProf
      ? "¡Datos de tu perfil actualizados exitosamente!"
      : "¡Perfil creado exitosamente! Está en revisión por administración para ser activado.",
  };
}
