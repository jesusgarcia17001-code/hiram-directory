import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/features/professionals/components/ProfileForm";

export default async function PanelPerfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Consultar localidades activas de Anzoátegui
  const { data: localities } = await supabase
    .from("localities")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name", { ascending: true });

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
      "id, provider_type, id_type, id_number, business_name, locality_id, description, experience_years, status"
    )
    .eq("owner_id", user!.id)
    .maybeSingle();

  let contacts = null;
  let categoryId: string | null = null;

  if (prof) {
    const { data: cData } = await supabase
      .from("professional_contacts")
      .select("whatsapp_phone, phone")
      .eq("professional_id", prof.id)
      .maybeSingle();
    contacts = cData;

    const { data: catData } = await supabase
      .from("professional_categories")
      .select("category_id")
      .eq("professional_id", prof.id)
      .limit(1)
      .maybeSingle();
    categoryId = catData?.category_id || null;
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
      }
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
            ? "Actualiza la información de tus servicios, datos de contacto y especialidad."
            : "Completa la ficha técnica para que tu perfil sea evaluado y publicado en el directorio."}
        </p>
      </div>

      {/* Formulario */}
      <ProfileForm
        initialData={initialData}
        localities={localities || []}
        categories={categories || []}
      />
    </div>
  );
}
