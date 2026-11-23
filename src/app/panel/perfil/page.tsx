import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/professionals/components/ProfileForm";
import { getActiveLocalitiesGrouped } from "@/services/locations";
import { getProfessionalPhotoLimit } from "@/features/professionals/media-actions";
import { ProfileLogoUploader } from "@/components/professionals/ProfileLogoUploader";
import { ProfileGalleryManager } from "@/components/professionals/ProfileGalleryManager";
import { ProfileServicesManager } from "@/components/professionals/ProfileServicesManager";

export default async function PanelPerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Consultar localidades activas agrupadas por municipio
  const groupedLocalities = await getActiveLocalitiesGrouped();

  // Consultar categorías activas
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Consultar perfil existente del usuario si ya lo creó
  const { data: prof } = await supabase
    .from("professionals")
    .select(
      "id, provider_type, id_type, id_number, business_name, logo_path, locality_id, description, experience_years, status, contact_person_name, instagram_handle, tiktok_handle, facebook_url, website_url"
    )
    .eq("owner_id", user!.id)
    .maybeSingle();

  let contacts = null;
  let categoryId: string | null = null;
  let categoryName: string | undefined = undefined;
  let photos: any[] = [];
  let userServices: any[] = [];
  let catalogServices: any[] = [];
  let photoLimit = { maxPhotos: 3, planName: "Gratuito" };

  if (prof) {
    const [cDataRes, catDataRes, photosRes, servicesRes, limitRes] = await Promise.all([
      supabase
        .from("professional_contacts")
        .select("whatsapp_phone, phone")
        .eq("professional_id", prof.id)
        .maybeSingle(),
      supabase
        .from("professional_categories")
        .select("category_id, categories (name)")
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
        .select("id, name, service_id")
        .eq("professional_id", prof.id)
        .order("created_at", { ascending: true }),
      getProfessionalPhotoLimit(prof.id),
    ]);

    contacts = cDataRes.data;
    categoryId = catDataRes.data?.category_id || null;
    categoryName = (catDataRes.data?.categories as any)?.name;
    photos = photosRes.data || [];
    userServices = servicesRes.data || [];
    photoLimit = limitRes;

    if (categoryId) {
      const { data: catSvcs } = await supabase
        .from("services")
        .select("id, name")
        .eq("category_id", categoryId)
        .eq("is_active", true)
        .order("name", { ascending: true });
      catalogServices = catSvcs || [];
    }
  }

  const initialData = prof
    ? {
        id: prof.id,
        provider_type: prof.provider_type,
        id_type: prof.id_type,
        id_number: prof.id_number,
        business_name: prof.business_name,
        locality_id: prof.locality_id,
        category_id: categoryId,
        description: prof.description,
        experience_years: prof.experience_years,
        whatsapp_phone: contacts?.whatsapp_phone || "",
        phone: contacts?.phone || "",
        status: prof.status,
        contact_person_name: prof.contact_person_name,
        instagram_handle: prof.instagram_handle,
        tiktok_handle: prof.tiktok_handle,
        facebook_url: prof.facebook_url,
        website_url: prof.website_url,
      }
    : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Encabezado y migas de pan */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-brand-text-muted mb-2">
          <Link href="/panel" className="hover:text-brand-primary">
            Panel
          </Link>
          <span>/</span>
          <span className="text-brand-text-primary font-medium">Mi Perfil</span>
        </nav>

        <h1 className="text-2xl font-bold text-brand-text-primary tracking-tight">
          {initialData?.id ? "Gestionar mi Perfil" : "Configurar mi Perfil de Servicio"}
        </h1>
        <p className="text-sm text-brand-text-muted mt-1">
          {initialData?.id
            ? "Actualiza tu fotografía de perfil, datos de contacto, especialidad, servicios y galería de trabajos."
            : "Completa la ficha técnica para que tu perfil sea evaluado y publicado en el directorio."}
        </p>
      </div>

      {/* 1. FOTO DE PERFIL / LOGO (Solo si ya existe el perfil) */}
      {initialData?.id && prof && (
        <ProfileLogoUploader
          initialLogoPath={prof.logo_path}
          businessName={prof.business_name}
        />
      )}

      {/* 2. FORMULARIO PRINCIPAL (Identificación, Especialidad, Ubicación, Contactos) */}
      <ProfileForm
        initialData={initialData}
        groupedLocalities={groupedLocalities}
        categories={categories || []}
      />

      {/* 3. SERVICIOS DEL PROFESIONAL (Solo si ya existe el perfil) */}
      {initialData?.id && (
        <ProfileServicesManager
          initialServices={userServices}
          suggestedCatalogServices={catalogServices}
          categoryName={categoryName}
        />
      )}

      {/* 4. GALERÍA DE TRABAJOS CON LÍMITE DEL PLAN (Solo si ya existe el perfil) */}
      {initialData?.id && prof && (
        <ProfileGalleryManager
          initialPhotos={photos}
          maxPhotos={photoLimit.maxPhotos}
          planName={photoLimit.planName}
          businessName={prof.business_name}
        />
      )}
    </div>
  );
}
