import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AdminCategoryItem {
  id: string;
  name: string;
  slug: string;
  listing_slug: string;
  singular_label: string;
  plural_label: string;
  description: string | null;
  seo_intro: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  professional_count: number;
}

/**
 * Consulta la lista de categorías para el panel de administración,
 * calculando la cantidad de profesionales asociados a cada una.
 * Utiliza la sesión del usuario (RLS comprueba si es admin).
 */
export async function getAdminCategories(): Promise<AdminCategoryItem[]> {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, slug, listing_slug, singular_label, plural_label, description, seo_intro, icon, is_active, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener categorías para admin:", error.message);
    return [];
  }

  if (!categories || categories.length === 0) {
    return [];
  }

  // Obtener conteo de profesionales por categoría
  const { data: counts, error: countError } = await supabase
    .from("professional_categories")
    .select("category_id");

  if (countError) {
    console.error("Error al obtener conteos de categorías:", countError.message);
  }

  const countMap = new Map<string, number>();
  (counts || []).forEach((c) => {
    countMap.set(c.category_id, (countMap.get(c.category_id) || 0) + 1);
  });

  return categories.map((cat) => ({
    ...cat,
    professional_count: countMap.get(cat.id) || 0,
  }));
}

/**
 * Obtiene la cantidad de profesionales asociados a una categoría específica.
 */
export async function getCategoryProfessionalCount(categoryId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("professional_categories")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) {
    console.error("Error al contar profesionales de la categoría:", error.message);
    return 0;
  }

  return count || 0;
}
