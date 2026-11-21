import { createClient } from "@/lib/supabase/server";
import type { Database, ProviderType } from "@/types/database";

export interface PublicProfessionalSummary {
  id: string;
  slug: string;
  business_name: string;
  description: string | null;
  logo_path?: string | null;
  locality_id: string | null;
  locality_name?: string;
  locality_slug?: string;
  service_areas: string[];
  experience_years: number | null;
  provider_type: ProviderType;
  is_featured: boolean;
  category_name?: string;
  category_listing_slug?: string;
}

/**
 * Consulta todas las categorías activas para el menú o selector.
 */
export async function getActiveCategories() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, listing_slug, singular_label, plural_label, description, icon")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return data || [];
}

/**
 * Busca una categoría por su listing_slug (ej: "plomeros", "electricistas").
 */
export async function getCategoryByListingSlug(listingSlug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, listing_slug, singular_label, plural_label, description, icon")
    .eq("listing_slug", listingSlug)
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

/**
 * Busca una localidad por su slug (ej: "puerto-la-cruz", "barcelona").
 */
export async function getLocalityBySlug(localitySlug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("localities")
    .select("id, name, slug, municipality_id")
    .eq("slug", localitySlug)
    .eq("is_active", true)
    .maybeSingle();

  return data;
}

/**
 * Consulta todas las combinaciones activas (categoría + localidad con al menos 1 profesional aprobado).
 * Fuente de verdad para páginas SEO publicables y sitemap.xml.
 */
export async function getListingCombinations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listing_combinations")
    .select("*")
    .order("listing_slug", { ascending: true });

  return data || [];
}

/**
 * Consulta las localidades que tienen al menos 1 profesional aprobado para una categoría específica.
 */
export async function getActiveLocalitiesForCategory(listingSlug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listing_combinations")
    .select("locality_id, locality_slug, locality_name, professional_count")
    .eq("listing_slug", listingSlug)
    .order("locality_name", { ascending: true });

  return data || [];
}

/**
 * Obtiene la lista de profesionales aprobados para una categoría dada,
 * opcionalmente filtrada por una localidad de Anzoátegui.
 * REGLA DE SEGURIDAD: Lee ÚNICAMENTE de la vista pública 'professionals_public'.
 */
export async function getApprovedProfessionalsByCategory(
  categoryId: string,
  localityId?: string
): Promise<PublicProfessionalSummary[]> {
  const supabase = await createClient();

  // 1. Obtener IDs de profesionales vinculados a esta categoría
  const { data: profCats } = await supabase
    .from("professional_categories")
    .select("professional_id")
    .eq("category_id", categoryId);

  if (!profCats || profCats.length === 0) {
    return [];
  }

  const profIds = profCats.map((pc) => pc.professional_id);

  // 2. Consultar únicamente en professionals_public (seguridad garantizada)
  let query = supabase
    .from("professionals_public")
    .select(
      "id, slug, business_name, description, logo_path, locality_id, service_areas, experience_years, provider_type, is_featured, created_at"
    )
    .in("id", profIds);

  if (localityId) {
    query = query.eq("locality_id", localityId);
  }

  // Ordenar destacados primero, luego los más recientes
  const { data: professionals } = await query
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (!professionals || professionals.length === 0) {
    return [];
  }

  // 3. Cruzar con nombres de localidades
  const localityIds = professionals
    .map((p) => p.locality_id)
    .filter((id): id is string => Boolean(id));

  const { data: localities } = localityIds.length > 0
    ? await supabase
        .from("localities")
        .select("id, name, slug")
        .in("id", localityIds)
    : { data: [] };

  const localityMap = new Map((localities || []).map((l) => [l.id, l]));

  return professionals.map((p) => {
    const loc = p.locality_id ? localityMap.get(p.locality_id) : null;
    return {
      id: p.id,
      slug: p.slug,
      business_name: p.business_name,
      description: p.description,
      logo_path: p.logo_path,
      locality_id: p.locality_id,
      locality_name: loc?.name,
      locality_slug: loc?.slug,
      service_areas: p.service_areas,
      experience_years: p.experience_years,
      provider_type: p.provider_type,
      is_featured: p.is_featured,
    };
  });
}

/**
 * Obtiene el detalle de un profesional aprobado por su slug único.
 * Utilizado por la ruta individual: /{categoria}/{localidad}/{slug-profesional}
 */
export async function getApprovedProfessionalBySlug(slug: string) {
  const supabase = await createClient();

  const { data: prof } = await supabase
    .from("professionals_public")
    .select(
      "id, slug, business_name, description, logo_path, locality_id, service_areas, experience_years, working_hours, availability, created_at, provider_type, contacts_enabled, is_featured"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!prof) {
    return null;
  }

  // Localidad, Categoría, Fotos de Galería y Servicios en paralelo
  const [locRes, profCatRes, photosRes, servicesRes] = await Promise.all([
    prof.locality_id
      ? supabase.from("localities").select("id, name, slug").eq("id", prof.locality_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("professional_categories")
      .select("category_id")
      .eq("professional_id", prof.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("professional_photos")
      .select("id, image_path, caption, sort_order")
      .eq("professional_id", prof.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("professional_services")
      .select("id, name, description")
      .eq("professional_id", prof.id)
      .order("created_at", { ascending: true }),
  ]);

  let category = null;
  if (profCatRes.data) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id, name, slug, listing_slug, singular_label, plural_label")
      .eq("id", profCatRes.data.category_id)
      .maybeSingle();
    category = cat;
  }

  return {
    professional: {
      ...prof,
      photos: photosRes.data || [],
      services: servicesRes.data || [],
    },
    locality: locRes.data,
    category,
  };
}
