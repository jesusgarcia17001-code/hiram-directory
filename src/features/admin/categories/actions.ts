"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations/category";
import { slugify } from "@/lib/validations/profile";
import { getCategoryProfessionalCount } from "@/services/categories";

export interface CategoryActionResult {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Función interna de seguridad: verifica que la petición provenga
 * de un usuario autenticado con rol 'admin'.
 * REGLA DE SEGURIDAD (CLAUDE.md): Comprobar en el servidor en cada acción.
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
 * Server Action para crear una nueva categoría.
 */
export async function createCategoryAction(
  prevState: CategoryActionResult | null,
  formData: FormData
): Promise<CategoryActionResult> {
  try {
    const { supabase } = await assertAdmin();

    const rawData = {
      name: formData.get("name"),
      listing_slug: formData.get("listing_slug"),
      singular_label: formData.get("singular_label"),
      plural_label: formData.get("plural_label"),
      description: formData.get("description") || "",
      seo_intro: formData.get("seo_intro") || "",
      icon: formData.get("icon") || "",
      sort_order: formData.get("sort_order") || 0,
      is_active: formData.get("is_active") === "true",
    };

    const parsed = categorySchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "Por favor corrige los datos del formulario.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;

    // Verificar si el listing_slug ya está en uso
    const { data: existingListingSlug } = await supabase
      .from("categories")
      .select("id")
      .eq("listing_slug", data.listing_slug)
      .maybeSingle();

    if (existingListingSlug) {
      return {
        success: false,
        message: "El slug de URL ya está en uso por otra categoría. Elige uno diferente.",
        errors: {
          listing_slug: ["Este slug ya existe en el sistema"],
        },
      };
    }

    // Generar slug interno único a partir del nombre
    const baseSlug = slugify(data.name) || data.listing_slug;
    let finalSlug = baseSlug;

    const { data: existingSlug } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", baseSlug)
      .maybeSingle();

    if (existingSlug) {
      finalSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const { error: insertError } = await supabase.from("categories").insert({
      name: data.name,
      slug: finalSlug,
      listing_slug: data.listing_slug,
      singular_label: data.singular_label,
      plural_label: data.plural_label,
      description: data.description || null,
      seo_intro: data.seo_intro || null,
      icon: data.icon || null,
      sort_order: data.sort_order,
      is_active: data.is_active,
    });

    if (insertError) {
      return {
        success: false,
        message: `Error al crear la categoría: ${insertError.message}`,
      };
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return {
      success: true,
      message: `¡Categoría "${data.name}" creada exitosamente!`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Ocurrió un error inesperado al crear la categoría.",
    };
  }
}

/**
 * Server Action para editar una categoría existente.
 * REGLA: Si la categoría ya tiene profesionales, el listing_slug queda bloqueado.
 */
export async function updateCategoryAction(
  categoryId: string,
  prevState: CategoryActionResult | null,
  formData: FormData
): Promise<CategoryActionResult> {
  try {
    const { supabase } = await assertAdmin();

    const rawData = {
      name: formData.get("name"),
      listing_slug: formData.get("listing_slug"),
      singular_label: formData.get("singular_label"),
      plural_label: formData.get("plural_label"),
      description: formData.get("description") || "",
      seo_intro: formData.get("seo_intro") || "",
      icon: formData.get("icon") || "",
      sort_order: formData.get("sort_order") || 0,
      is_active: formData.get("is_active") === "true",
    };

    const parsed = categorySchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "Por favor corrige los datos del formulario.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const data = parsed.data;

    // Obtener la categoría actual
    const { data: currentCat, error: fetchError } = await supabase
      .from("categories")
      .select("id, listing_slug")
      .eq("id", categoryId)
      .maybeSingle();

    if (fetchError || !currentCat) {
      return {
        success: false,
        message: "Categoría no encontrada.",
      };
    }

    // Verificar si ya tiene profesionales asociados
    const profCount = await getCategoryProfessionalCount(categoryId);

    let finalListingSlug = currentCat.listing_slug;

    if (profCount > 0) {
      // Bloqueado: No se permite cambiar el listing_slug para proteger SEO
      finalListingSlug = currentCat.listing_slug;
    } else {
      // Si no tiene profesionales, permitir cambio comprobando unicidad
      if (data.listing_slug !== currentCat.listing_slug) {
        const { data: takenSlug } = await supabase
          .from("categories")
          .select("id")
          .eq("listing_slug", data.listing_slug)
          .neq("id", categoryId)
          .maybeSingle();

        if (takenSlug) {
          return {
            success: false,
            message: "El slug de URL ya está en uso por otra categoría.",
            errors: {
              listing_slug: ["Este slug ya existe"],
            },
          };
        }
        finalListingSlug = data.listing_slug;
      }
    }

    const { error: updateError } = await supabase
      .from("categories")
      .update({
        name: data.name,
        listing_slug: finalListingSlug,
        singular_label: data.singular_label,
        plural_label: data.plural_label,
        description: data.description || null,
        seo_intro: data.seo_intro || null,
        icon: data.icon || null,
        sort_order: data.sort_order,
        is_active: data.is_active,
      })
      .eq("id", categoryId);

    if (updateError) {
      return {
        success: false,
        message: `Error al actualizar categoría: ${updateError.message}`,
      };
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return {
      success: true,
      message: `¡Categoría "${data.name}" actualizada exitosamente!`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Ocurrió un error inesperado al actualizar la categoría.",
    };
  }
}

/**
 * Server Action para alternar estado activa/inactiva.
 * REGLA ESTRICTA (CLAUDE.md): NUNCA borrar categorías.
 */
export async function toggleCategoryStatusAction(
  categoryId: string,
  currentStatus: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const { supabase } = await assertAdmin();

    const newStatus = !currentStatus;

    const { error } = await supabase
      .from("categories")
      .update({ is_active: newStatus })
      .eq("id", categoryId);

    if (error) {
      return {
        success: false,
        message: `Error al cambiar estado: ${error.message}`,
      };
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/panel/perfil");
    revalidatePath("/");

    return {
      success: true,
      message: newStatus
        ? "Categoría activada exitosamente."
        : "Categoría desactivada (oculta para nuevos registros y público).",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Error al actualizar estado.",
    };
  }
}
