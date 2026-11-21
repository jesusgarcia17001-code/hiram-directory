"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  stateSchema,
  municipalitySchema,
  localitySchema,
} from "@/lib/validations/locations";
import { slugify } from "@/lib/validations/profile";

export interface LocationActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  suggestedSlug?: string;
}

/**
 * Verificación estricta de rol admin en el servidor.
 */
async function assertAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para realizar esta acción.");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    throw new Error("No autorizado: se requiere rol de administrador.");
  }

  return { supabase, user };
}

/**
 * 1. Crear nuevo Estado
 */
export async function createStateAction(
  prevState: LocationActionResult | null,
  formData: FormData
): Promise<LocationActionResult> {
  try {
    const { supabase } = await assertAdmin();

    const rawData = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      is_active: formData.get("is_active") === "true",
    };

    const parsed = stateSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Datos de estado inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;

    // Verificar unicidad
    const { data: existing } = await supabase
      .from("states")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        message: "Ya existe un estado con este slug.",
        errors: { slug: ["El slug ya existe"] },
      };
    }

    const { error: insertError } = await supabase.from("states").insert({
      name: data.name,
      slug: data.slug,
      is_active: data.is_active,
    });

    if (insertError) {
      return { success: false, message: `Error al crear estado: ${insertError.message}` };
    }

    revalidatePath("/admin/ubicaciones");
    revalidatePath("/panel/perfil");

    return {
      success: true,
      message: `¡Estado "${data.name}" creado exitosamente!`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al crear estado." };
  }
}

/**
 * 2. Crear nuevo Municipio
 */
export async function createMunicipalityAction(
  prevState: LocationActionResult | null,
  formData: FormData
): Promise<LocationActionResult> {
  try {
    const { supabase } = await assertAdmin();

    const rawData = {
      state_id: formData.get("state_id"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      is_active: formData.get("is_active") === "true",
    };

    const parsed = municipalitySchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Datos de municipio inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;

    // Verificar unicidad dentro del estado
    const { data: existing } = await supabase
      .from("municipalities")
      .select("id")
      .eq("state_id", data.state_id)
      .eq("slug", data.slug)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        message: "Ya existe un municipio con este slug en este estado.",
        errors: { slug: ["El slug ya existe en este estado"] },
      };
    }

    const { error: insertError } = await supabase.from("municipalities").insert({
      state_id: data.state_id,
      name: data.name,
      slug: data.slug,
      is_active: data.is_active,
    });

    if (insertError) {
      return { success: false, message: `Error al crear municipio: ${insertError.message}` };
    }

    revalidatePath("/admin/ubicaciones");
    revalidatePath("/panel/perfil");

    return {
      success: true,
      message: `¡Municipio "${data.name}" creado exitosamente!`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al crear municipio." };
  }
}

/**
 * 3. Crear nueva Localidad (Ciudades, pueblos o zonas rurales)
 * Si el slug choca globalmente, propone añadir el sufijo del municipio.
 */
export async function createLocalityAction(
  prevState: LocationActionResult | null,
  formData: FormData
): Promise<LocationActionResult> {
  try {
    const { supabase } = await assertAdmin();

    const rawData = {
      municipality_id: formData.get("municipality_id"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      is_active: formData.get("is_active") === "true",
    };

    const parsed = localitySchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Datos de localidad inválidos.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;

    // Verificar unicidad global de slug en localidades
    const { data: existing } = await supabase
      .from("localities")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();

    if (existing) {
      // Obtener el slug del municipio para sugerir la alternativa
      const { data: mun } = await supabase
        .from("municipalities")
        .select("slug")
        .eq("id", data.municipality_id)
        .single();

      const suggestedSlug = mun ? `${data.slug}-${mun.slug}` : `${data.slug}-1`;

      return {
        success: false,
        message: `El slug "${data.slug}" ya está en uso por otra localidad. Te sugerimos usar "${suggestedSlug}".`,
        suggestedSlug,
        errors: {
          slug: [`El slug ya existe. Sugerencia: ${suggestedSlug}`],
        },
      };
    }

    const { error: insertError } = await supabase.from("localities").insert({
      municipality_id: data.municipality_id,
      name: data.name,
      slug: data.slug,
      is_active: data.is_active,
    });

    if (insertError) {
      return { success: false, message: `Error al crear localidad: ${insertError.message}` };
    }

    revalidatePath("/admin/ubicaciones");
    revalidatePath("/panel/perfil");

    return {
      success: true,
      message: `¡Localidad "${data.name}" creada exitosamente!`,
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al crear localidad." };
  }
}

/**
 * 4. Editar nombre y slug de una ubicación (Estado, Municipio o Localidad)
 * REGLA: Si la localidad ya tiene profesionales, el slug queda bloqueado.
 */
export async function updateLocationAction(
  type: "state" | "municipality" | "locality",
  id: string,
  prevState: LocationActionResult | null,
  formData: FormData
): Promise<LocationActionResult> {
  try {
    const { supabase } = await assertAdmin();

    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim().toLowerCase();

    if (!name || name.length < 2) {
      return { success: false, message: "El nombre debe tener al menos 2 caracteres." };
    }

    if (type === "state") {
      const { error } = await supabase
        .from("states")
        .update({ name, slug })
        .eq("id", id);
      if (error) return { success: false, message: error.message };
    } else if (type === "municipality") {
      const { error } = await supabase
        .from("municipalities")
        .update({ name, slug })
        .eq("id", id);
      if (error) return { success: false, message: error.message };
    } else {
      // Localidad: comprobar si tiene profesionales
      const { count } = await supabase
        .from("professionals")
        .select("*", { count: "exact", head: true })
        .eq("locality_id", id);

      const hasProfessionals = (count || 0) > 0;

      // Si tiene profesionales, conservar el slug actual
      if (hasProfessionals) {
        const { error } = await supabase
          .from("localities")
          .update({ name })
          .eq("id", id);
        if (error) return { success: false, message: error.message };
      } else {
        const { error } = await supabase
          .from("localities")
          .update({ name, slug })
          .eq("id", id);
        if (error) return { success: false, message: error.message };
      }
    }

    revalidatePath("/admin/ubicaciones");
    revalidatePath("/panel/perfil");

    return {
      success: true,
      message: "¡Ubicación actualizada correctamente!",
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al actualizar ubicación." };
  }
}

/**
 * 5. Alternar estado activo / inactivo de una ubicación
 * NUNCA BORRAR.
 */
export async function toggleLocationStatusAction(
  type: "state" | "municipality" | "locality",
  id: string,
  currentStatus: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const { supabase } = await assertAdmin();

    const newStatus = !currentStatus;
    const table = type === "state" ? "states" : type === "municipality" ? "municipalities" : "localities";

    const { error } = await (supabase.from(table) as any)
      .update({ is_active: newStatus })
      .eq("id", id);

    if (error) {
      return { success: false, message: `Error al cambiar estado: ${error.message}` };
    }

    revalidatePath("/admin/ubicaciones");
    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return {
      success: true,
      message: newStatus ? "Ubicación activada." : "Ubicación desactivada.",
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Error al actualizar estado." };
  }
}
