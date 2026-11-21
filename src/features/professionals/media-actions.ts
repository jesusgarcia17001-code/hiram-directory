"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  processAndOptimizeImage,
  getPublicMediaUrl,
} from "@/lib/storage";
import {
  photoCaptionSchema,
  professionalServiceSchema,
  MAX_SERVICES_PER_PROFESSIONAL,
} from "@/lib/validations/media";

export interface MediaActionResult {
  success: boolean;
  message?: string;
  reachedLimit?: boolean;
  maxPhotos?: number;
  currentCount?: number;
  data?: any;
}

/**
 * Obtiene el profesional correspondiente al usuario autenticado.
 * Garantiza que un usuario solo pueda gestionar su propio perfil.
 */
async function assertProfessionalOwner() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para realizar esta acción.");
  }

  const { data: prof, error } = await supabase
    .from("professionals")
    .select("id, slug, logo_path")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error || !prof) {
    throw new Error("No tienes un perfil profesional creado para gestionar.");
  }

  return { supabase, user, professional: prof };
}

/**
 * Consulta el plan vigente del profesional y extrae su límite de fotos dinámico (max_photos).
 * REGLA: Si tiene suscripción activa (status='active' y ends_at > now()), se toma ese plan.
 * De lo contrario, se toma el plan 'gratuito'.
 * Nunca escribir números en duro; siempre leer de plans.features.max_photos.
 */
export async function getProfessionalPhotoLimit(professionalId: string): Promise<{
  maxPhotos: number;
  planName: string;
}> {
  const supabase = await createClient();

  const nowIso = new Date().toISOString();

  // 1. Buscar suscripción activa vigente
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan_id, plans (name, features)")
    .eq("professional_id", professionalId)
    .eq("status", "active")
    .gt("ends_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sub && sub.plans) {
    const plan = sub.plans as any;
    const maxPhotos = Number(plan.features?.max_photos ?? 3);
    return { maxPhotos, planName: plan.name || "Profesional" };
  }

  // 2. Si no tiene suscripción activa, consultar el plan gratuito
  const { data: freePlan } = await supabase
    .from("plans")
    .select("name, features")
    .eq("slug", "gratuito")
    .single();

  const maxPhotos = Number((freePlan?.features as any)?.max_photos ?? 3);
  return { maxPhotos, planName: freePlan?.name || "Gratuito" };
}

// =====================================================================
// 1. FOTO DE PERFIL / LOGO
// =====================================================================

export async function uploadLogoAction(
  formData: FormData
): Promise<MediaActionResult> {
  try {
    const { supabase, professional } = await assertProfessionalOwner();

    const file = formData.get("logo") as File;
    if (!file || file.size === 0) {
      return { success: false, message: "Por favor selecciona un archivo de imagen." };
    }

    // Procesar y optimizar a WebP
    const processed = await processAndOptimizeImage(file, professional.id);

    // Subir a Supabase Storage en 'professional-media'
    const { error: uploadError } = await supabase.storage
      .from("professional-media")
      .upload(processed.path, processed.buffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      return { success: false, message: `Error al subir logo: ${uploadError.message}` };
    }

    // Si ya existía un logo anterior distinto, borrarlo del bucket para no acumular archivos
    const oldPath = professional.logo_path;
    if (oldPath && oldPath !== processed.path) {
      await supabase.storage.from("professional-media").remove([oldPath]);
    }

    // Actualizar professionals.logo_path
    const { error: updateError } = await supabase
      .from("professionals")
      .update({ logo_path: processed.path })
      .eq("id", professional.id);

    if (updateError) {
      return { success: false, message: `Error al guardar logo: ${updateError.message}` };
    }

    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return {
      success: true,
      message: "¡Foto de perfil / logo actualizado exitosamente!",
      data: {
        logoPath: processed.path,
        publicUrl: getPublicMediaUrl(processed.path),
      },
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al subir logo." };
  }
}

export async function deleteLogoAction(): Promise<MediaActionResult> {
  try {
    const { supabase, professional } = await assertProfessionalOwner();

    const oldPath = professional.logo_path;
    if (oldPath) {
      await supabase.storage.from("professional-media").remove([oldPath]);
    }

    const { error } = await supabase
      .from("professionals")
      .update({ logo_path: null })
      .eq("id", professional.id);

    if (error) {
      return { success: false, message: `Error al eliminar logo: ${error.message}` };
    }

    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return { success: true, message: "Foto de perfil eliminada. Se mostrará el avatar neutro." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al eliminar logo." };
  }
}

// =====================================================================
// 2. GALERÍA DE TRABAJOS (professional_photos)
// =====================================================================

export async function uploadGalleryPhotoAction(
  formData: FormData
): Promise<MediaActionResult> {
  try {
    const { supabase, professional } = await assertProfessionalOwner();

    const file = formData.get("photo") as File;
    const captionRaw = formData.get("caption") as string;

    if (!file || file.size === 0) {
      return { success: false, message: "Por favor selecciona un archivo de imagen." };
    }

    const captionParsed = photoCaptionSchema.safeParse(captionRaw);
    if (!captionParsed.success) {
      return {
        success: false,
        message: captionParsed.error.issues[0]?.message || "Pie de foto inválido.",
      };
    }

    // 1. Validar límite de fotos en el SERVIDOR según el plan actual
    const { maxPhotos, planName } = await getProfessionalPhotoLimit(professional.id);

    const { count, error: countErr } = await supabase
      .from("professional_photos")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", professional.id);

    if (countErr) {
      return { success: false, message: "No fue posible verificar tus fotos actuales." };
    }

    const currentCount = count || 0;
    if (currentCount >= maxPhotos) {
      return {
        success: false,
        reachedLimit: true,
        maxPhotos,
        currentCount,
        message: `Alcanzaste el límite de fotos de tu plan (${maxPhotos} fotos con el Plan ${planName}). Te invitamos a mejorar tu plan para mostrar más fotografías de tus trabajos.`,
      };
    }

    // 2. Procesar y optimizar a WebP
    const processed = await processAndOptimizeImage(file, professional.id);

    // 3. Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("professional-media")
      .upload(processed.path, processed.buffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, message: `Error al subir imagen: ${uploadError.message}` };
    }

    // 4. Insertar fila en professional_photos
    const sortOrder = currentCount + 1;
    const { error: insertError } = await supabase
      .from("professional_photos")
      .insert({
        professional_id: professional.id,
        image_path: processed.path,
        caption: captionParsed.data || null,
        sort_order: sortOrder,
      });

    if (insertError) {
      // Si falla la inserción en base de datos, limpiar el archivo subido
      await supabase.storage.from("professional-media").remove([processed.path]);
      return { success: false, message: `Error al registrar foto: ${insertError.message}` };
    }

    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return {
      success: true,
      message: "¡Foto agregada a tu galería exitosamente!",
      maxPhotos,
      currentCount: currentCount + 1,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al subir foto a la galería." };
  }
}

export async function updatePhotoCaptionAction(
  photoId: string,
  caption: string
): Promise<MediaActionResult> {
  try {
    const { supabase, professional } = await assertProfessionalOwner();

    const captionParsed = photoCaptionSchema.safeParse(caption);
    if (!captionParsed.success) {
      return {
        success: false,
        message: captionParsed.error.issues[0]?.message || "Pie de foto inválido.",
      };
    }

    const { error } = await supabase
      .from("professional_photos")
      .update({ caption: captionParsed.data || null })
      .eq("id", photoId)
      .eq("professional_id", professional.id);

    if (error) {
      return { success: false, message: `Error al actualizar pie de foto: ${error.message}` };
    }

    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return { success: true, message: "Pie de foto actualizado." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al actualizar pie de foto." };
  }
}

export async function deleteGalleryPhotoAction(
  photoId: string
): Promise<MediaActionResult> {
  try {
    const { supabase, professional } = await assertProfessionalOwner();

    // Obtener la ruta para borrarla de Storage
    const { data: photo } = await supabase
      .from("professional_photos")
      .select("image_path")
      .eq("id", photoId)
      .eq("professional_id", professional.id)
      .maybeSingle();

    if (!photo) {
      return { success: false, message: "La foto no existe o no te pertenece." };
    }

    // 1. Borrar de Storage
    if (photo.image_path) {
      await supabase.storage.from("professional-media").remove([photo.image_path]);
    }

    // 2. Borrar de la tabla
    const { error } = await supabase
      .from("professional_photos")
      .delete()
      .eq("id", photoId)
      .eq("professional_id", professional.id);

    if (error) {
      return { success: false, message: `Error al eliminar foto: ${error.message}` };
    }

    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return { success: true, message: "Foto eliminada de tu galería." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al eliminar foto." };
  }
}

export async function updatePhotosOrderAction(
  orderedIds: string[]
): Promise<MediaActionResult> {
  try {
    const { supabase, professional } = await assertProfessionalOwner();

    // Actualizar orden de cada foto perteneciente al profesional
    const updates = orderedIds.map((id, index) =>
      supabase
        .from("professional_photos")
        .update({ sort_order: index + 1 })
        .eq("id", id)
        .eq("professional_id", professional.id)
    );

    await Promise.all(updates);

    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return { success: true, message: "Orden de la galería guardado." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al reordenar galería." };
  }
}

// =====================================================================
// 3. SERVICIOS DEL PROFESIONAL (professional_services)
// =====================================================================

export async function addProfessionalServiceAction(
  name: string,
  serviceId?: string | null
): Promise<MediaActionResult> {
  try {
    const { supabase, professional } = await assertProfessionalOwner();

    // Validar datos del servicio
    const parsed = professionalServiceSchema.safeParse({ name });
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Nombre de servicio inválido.",
      };
    }

    // Validar límite máximo de 15 servicios por perfil
    const { count, error: countErr } = await supabase
      .from("professional_services")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", professional.id);

    if (countErr) {
      return { success: false, message: "Error al verificar cantidad de servicios." };
    }

    if ((count || 0) >= MAX_SERVICES_PER_PROFESSIONAL) {
      return {
        success: false,
        message: `Has alcanzado el límite máximo de ${MAX_SERVICES_PER_PROFESSIONAL} servicios por perfil.`,
      };
    }

    // Insertar servicio
    const { error: insertError } = await supabase
      .from("professional_services")
      .insert({
        professional_id: professional.id,
        service_id: serviceId || null,
        name: parsed.data.name,
      });

    if (insertError) {
      return { success: false, message: `Error al agregar servicio: ${insertError.message}` };
    }

    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return { success: true, message: `Servicio "${parsed.data.name}" agregado.` };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al agregar servicio." };
  }
}

export async function deleteProfessionalServiceAction(
  serviceId: string
): Promise<MediaActionResult> {
  try {
    const { supabase, professional } = await assertProfessionalOwner();

    const { error } = await supabase
      .from("professional_services")
      .delete()
      .eq("id", serviceId)
      .eq("professional_id", professional.id);

    if (error) {
      return { success: false, message: `Error al eliminar servicio: ${error.message}` };
    }

    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return { success: true, message: "Servicio eliminado de tu lista." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al eliminar servicio." };
  }
}
