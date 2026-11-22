import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { getActiveCategories, getListingCombinations } from "@/services/directory";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // 1. Portada principal y páginas institucionales
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${site.url}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${site.url}/terminos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${site.url}/privacidad`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Páginas de categoría general en Anzoátegui (ej: /plomeros)
  const categories = await getActiveCategories();
  const categoryUrls: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${site.url}/${cat.listing_slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  // 3. Páginas de categoría por ciudad con al menos 1 profesional (listing_combinations)
  const combinations = await getListingCombinations();
  const combinationUrls: MetadataRoute.Sitemap = combinations.map((comb) => ({
    url: `${site.url}/${comb.listing_slug}/${comb.locality_slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // 4. Perfiles individuales de profesionales aprobados
  const { data: professionals = [] } = await supabase
    .from("professionals_public")
    .select("id, slug, locality_id, created_at");

  let profileUrls: MetadataRoute.Sitemap = [];

  if (professionals && professionals.length > 0) {
    const profIds = professionals.map((p) => p.id);
    const localityIds = professionals
      .map((p) => p.locality_id)
      .filter((id): id is string => Boolean(id));

    // Localidades
    const { data: localities = [] } = localityIds.length > 0
      ? await supabase
          .from("localities")
          .select("id, slug")
          .in("id", localityIds)
      : { data: [] };

    const locMap = new Map((localities || []).map((l) => [l.id, l.slug]));

    // Categorías principales del profesional
    const { data: profCats = [] } = await supabase
      .from("professional_categories")
      .select("professional_id, category_id")
      .in("professional_id", profIds);

    const catIds = (profCats || []).map((pc) => pc.category_id);
    const { data: allCats = [] } = catIds.length > 0
      ? await supabase
          .from("categories")
          .select("id, listing_slug")
          .in("id", catIds)
      : { data: [] };

    const catMap = new Map((allCats || []).map((c) => [c.id, c.listing_slug]));
    const profToCatSlug = new Map(
      (profCats || []).map((pc) => [pc.professional_id, catMap.get(pc.category_id)])
    );

    profileUrls = professionals.map((p) => {
      const locSlug = p.locality_id ? locMap.get(p.locality_id) : "anzoategui";
      const catSlug = profToCatSlug.get(p.id) || "servicios";

      return {
        url: `${site.url}/${catSlug}/${locSlug}/${p.slug}`,
        lastModified: new Date(p.created_at),
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });
  }

  // REGLA CLAUDE.md: /admin, /panel, /api, login/registro quedan fuera del sitemap
  return [
    ...staticUrls,
    ...categoryUrls,
    ...combinationUrls,
    ...profileUrls,
  ];
}
