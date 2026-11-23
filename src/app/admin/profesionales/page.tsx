import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfessionalStatusButtons } from "@/features/admin/components/ProfessionalStatusButtons";

export const dynamic = "force-dynamic";

export default async function AdminProfesionalesPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const supabase = await createClient();
  const { estado } = await searchParams;

  // 1. Consultar todos los profesionales
  let query = supabase
    .from("professionals")
    .select(
      "id, owner_id, business_name, slug, provider_type, id_type, id_number, status, description, experience_years, locality_id, created_at"
    )
    .order("created_at", { ascending: false });

  if (estado && ["pending", "approved", "rejected", "suspended"].includes(estado)) {
    query = query.eq("status", estado as "pending" | "approved" | "rejected" | "suspended");
  }

  const { data: professionals = [] } = await query;
  const profList = professionals || [];

  // Extraer IDs para consultas complementarias
  const profIds = profList.map((p) => p.id);
  const ownerIds = profList.map((p) => p.owner_id);
  const localityIds = profList
    .map((p) => p.locality_id)
    .filter((id): id is string => Boolean(id));

  // 2. Consultar contactos
  const { data: contactsList = [] } = profIds.length > 0
    ? await supabase
        .from("professional_contacts")
        .select("professional_id, whatsapp_phone, phone")
        .in("professional_id", profIds)
    : { data: [] };

  const contactsMap = new Map(
    (contactsList || []).map((c) => [c.professional_id, c])
  );

  // 3. Consultar localidades
  const { data: localitiesList = [] } = localityIds.length > 0
    ? await supabase
        .from("localities")
        .select("id, name, slug")
        .in("id", localityIds)
    : { data: [] };

  const localitiesMap = new Map(
    (localitiesList || []).map((l) => [l.id, l])
  );

  // 4. Consultar categorías asociadas
  const { data: profCatsList = [] } = profIds.length > 0
    ? await supabase
        .from("professional_categories")
        .select("professional_id, category_id")
        .in("professional_id", profIds)
    : { data: [] };

  const catIds = (profCatsList || []).map((pc) => pc.category_id);
  const { data: categoriesList = [] } = catIds.length > 0
    ? await supabase
        .from("categories")
        .select("id, name")
        .in("id", catIds)
    : { data: [] };

  const categoriesMap = new Map(
    (categoriesList || []).map((cat) => [cat.id, cat])
  );

  const profToCategoryMap = new Map(
    (profCatsList || []).map((pc) => [pc.professional_id, categoriesMap.get(pc.category_id)])
  );

  // 5. Consultar perfiles de usuario (dueños)
  const { data: ownersList = [] } = ownerIds.length > 0
    ? await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .in("id", ownerIds)
    : { data: [] };

  const ownersMap = new Map(
    (ownersList || []).map((u) => [u.id, u])
  );

  // Filtros de navegación
  const tabs = [
    { label: "Todos", value: undefined },
    { label: "Pendientes", value: "pending" },
    { label: "Aprobados", value: "approved" },
    { label: "Rechazados", value: "rejected" },
    { label: "Suspendidos", value: "suspended" },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado y Navegación interna */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/admin" className="hover:text-white">
              Administración
            </Link>
            <span>/</span>
            <span className="text-white font-medium">Profesionales</span>
          </nav>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Gestión y Aprobación de Profesionales
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evalúa la documentación y activa perfiles para hacerlos visibles en el directorio público.
          </p>
        </div>

        {/* Pestañas de filtrado por estado */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = estado === tab.value;
            const href = tab.value
              ? `/admin/profesionales?estado=${tab.value}`
              : "/admin/profesionales";

            return (
              <Link
                key={tab.label}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Lista de Profesionales */}
      {profList.length === 0 ? (
        <div className="bg-slate-900 p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <span className="text-4xl">📭</span>
          <p className="text-sm font-bold text-white">
            No hay profesionales registrados con este criterio.
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {estado
              ? `No se encontraron profesionales con estado "${estado}".`
              : "Aún no se han registrado técnicos o empresas en el directorio."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {profList.map((p) => {
            const owner = ownersMap.get(p.owner_id);
            const locality = p.locality_id ? localitiesMap.get(p.locality_id) : null;
            const category = profToCategoryMap.get(p.id);
            const contact = contactsMap.get(p.id);

            return (
              <div
                key={p.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5"
              >
                {/* Cabecera de la Ficha */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {p.provider_type === "company"
                          ? "🏢 Empresa / Taller"
                          : "👤 Técnico Independiente"}
                      </span>

                      {/* Estado */}
                      {p.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          ⏳ Pendiente de revisión
                        </span>
                      )}
                      {p.status === "approved" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          ✓ Aprobado y Visible
                        </span>
                      )}
                      {p.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-800">
                          ✕ Rechazado / Requiere correcciones
                        </span>
                      )}
                      {p.status === "suspended" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          ⏸ Suspendido
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-black text-white">
                      {p.business_name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Slug identificador: <code className="text-slate-300 font-mono">{p.slug}</code>
                    </p>
                  </div>

                  {/* Documento y Dueño */}
                  <div className="text-left sm:text-right space-y-0.5 text-xs text-slate-400">
                    <p>
                      Documento:{" "}
                      <span className="text-white font-bold font-mono">
                        {p.id_type ? `${p.id_type}-${p.id_number}` : "No especificado"}
                      </span>
                    </p>
                    <p>
                      Usuario: <span className="text-white">{owner?.full_name || "Sin nombre"}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">{owner?.email}</p>
                  </div>
                </div>

                {/* Detalles Técnicos y Contactos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                      Especialidad Principal
                    </span>
                    <p className="font-bold text-white">
                      {category?.name || "Sin categoría"}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                      Ciudad Base
                    </span>
                    <p className="font-bold text-white">
                      {locality?.name || "No asignada"} (Anzoátegui)
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                      WhatsApp Directo
                    </span>
                    <p className="font-bold text-emerald-400 font-mono">
                      {contact?.whatsapp_phone || "No configurado"}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 font-semibold block uppercase text-[10px]">
                      Experiencia
                    </span>
                    <p className="font-bold text-white">
                      {p.experience_years ?? 0} años en el oficio
                    </p>
                  </div>
                </div>

                {/* Descripción / Bio */}
                {p.description && (
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Descripción de Servicios
                    </span>
                    <p className="leading-relaxed">{p.description}</p>
                  </div>
                )}

                {/* Barra de Acciones Administrativas */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800">
                  <span className="text-[11px] text-slate-500">
                    Registrado el {new Date(p.created_at).toLocaleDateString("es-VE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/profesionales/${p.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/80 rounded-xl transition-colors"
                    >
                      <span>✏️</span>
                      <span>Editar Ficha</span>
                    </Link>

                    <ProfessionalStatusButtons
                      professionalId={p.id}
                      currentStatus={p.status}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
