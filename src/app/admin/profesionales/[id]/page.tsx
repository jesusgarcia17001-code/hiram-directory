import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminProfessionalEditForm } from "@/features/admin/components/AdminProfessionalEditForm";
import { getActiveLocalitiesGrouped } from "@/services/locations";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEditProfessionalPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Verificar autenticación y rol de admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userProfile || userProfile.role !== "admin") {
    redirect("/admin");
  }

  // 2. Consultar datos del profesional con cliente administrador
  const adminClient = createAdminClient();

  const { data: professional, error: profErr } = await adminClient
    .from("professionals")
    .select(
      "id, owner_id, business_name, slug, provider_type, id_type, id_number, status, description, experience_years, locality_id, created_at, updated_at, contact_person_name, instagram_handle, tiktok_handle, facebook_url, website_url"
    )
    .eq("id", id)
    .single();

  if (profErr || !professional) {
    notFound();
  }

  // 3. Consultar contactos
  const { data: contact } = await adminClient
    .from("professional_contacts")
    .select("whatsapp_phone, phone")
    .eq("professional_id", professional.id)
    .maybeSingle();

  // 4. Consultar categoría actual
  const { data: currentCatRel } = await adminClient
    .from("professional_categories")
    .select("category_id")
    .eq("professional_id", professional.id)
    .maybeSingle();

  const currentCategoryId = currentCatRel?.category_id || null;

  // 5. Consultar todas las categorías activas
  const { data: categories = [] } = await adminClient
    .from("categories")
    .select("id, name, slug, listing_slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // 6. Consultar localidades
  const groupedLocalities = await getActiveLocalitiesGrouped();
  const flatLocalities = groupedLocalities.flatMap((group) =>
    group.localities.map((loc) => ({
      id: loc.id,
      name: loc.name,
      municipality_name: group.municipalityName,
      slug: loc.slug,
    }))
  );

  // 7. Consultar datos del usuario propietario
  const { data: owner } = await adminClient
    .from("user_profiles")
    .select("full_name, email")
    .eq("id", professional.owner_id)
    .maybeSingle();

  // 8. Construir URL pública para previsualización
  const catObj = (categories || []).find((c) => c.id === currentCategoryId);
  const locObj = flatLocalities.find((l) => l.id === professional.locality_id);
  const publicPath =
    catObj?.listing_slug && locObj?.slug
      ? `/${catObj.listing_slug}/${locObj.slug}/${professional.slug}`
      : undefined;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navegación y encabezado */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/admin" className="hover:text-white transition-colors">
            Administración
          </Link>
          <span>/</span>
          <Link href="/admin/profesionales" className="hover:text-white transition-colors">
            Profesionales
          </Link>
          <span>/</span>
          <span className="text-slate-200">Editar Ficha</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <span>✏️</span>
              <span>Editar: {professional.business_name}</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Modifica directamente los datos del perfil, oficio, números de contacto y ciudad base.
            </p>
          </div>

          {publicPath && (
            <Link
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/80 rounded-xl hover:bg-amber-900/50 hover:text-amber-300 transition-colors w-fit"
            >
              <span>Ver ficha pública</span>
              <span>↗</span>
            </Link>
          )}
        </div>
      </div>

      {/* Tarjeta de Información Administrativa del Registro */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
        <div>
          <span className="text-slate-500 uppercase text-[10px] font-bold block">
            Usuario Propietario
          </span>
          <p className="font-semibold text-white mt-0.5">{owner?.full_name || "Sin nombre"}</p>
          <p className="text-slate-400 text-[11px] font-mono">{owner?.email || "Sin email"}</p>
        </div>

        <div>
          <span className="text-slate-500 uppercase text-[10px] font-bold block">
            Documento de Identidad
          </span>
          <p className="font-semibold text-white mt-0.5">
            {professional.id_type
              ? `${professional.id_type}-${professional.id_number}`
              : "No especificado"}
          </p>
          <p className="text-slate-400 text-[11px]">
            Tipo: {professional.provider_type === "company" ? "Empresa / Taller" : "Técnico Independiente"}
          </p>
        </div>

        <div>
          <span className="text-slate-500 uppercase text-[10px] font-bold block">
            Fecha de Registro
          </span>
          <p className="font-semibold text-white mt-0.5">
            {new Date(professional.created_at).toLocaleDateString("es-VE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-slate-400 text-[11px]">
            ID: <code className="text-slate-300 font-mono">{professional.id.slice(0, 8)}...</code>
          </p>
        </div>
      </div>

      {/* Formulario de Edición */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <AdminProfessionalEditForm
          professional={{
            id: professional.id,
            business_name: professional.business_name,
            slug: professional.slug,
            status: professional.status,
            experience_years: professional.experience_years,
            locality_id: professional.locality_id,
            description: professional.description,
            contact_person_name: professional.contact_person_name,
            instagram_handle: professional.instagram_handle,
            tiktok_handle: professional.tiktok_handle,
            facebook_url: professional.facebook_url,
            website_url: professional.website_url,
          }}
          contact={{
            whatsapp_phone: contact?.whatsapp_phone || null,
            phone: contact?.phone || null,
          }}
          currentCategoryId={currentCategoryId}
          categories={categories || []}
          localities={flatLocalities}
          publicPath={publicPath}
        />
      </div>
    </div>
  );
}
