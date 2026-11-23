"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import {
  adminUpdateProfessionalAction,
  AdminEditActionResult,
} from "../actions-professional-edit";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface CategoryOption {
  id: string;
  name: string;
}

interface LocalityOption {
  id: string;
  name: string;
  municipality_name?: string;
}

interface ProfessionalData {
  id: string;
  business_name: string;
  slug: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  experience_years: number | null;
  locality_id: string | null;
  description: string | null;
  contact_person_name?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  facebook_url?: string | null;
  website_url?: string | null;
}

interface ContactData {
  whatsapp_phone: string | null;
  phone: string | null;
}

interface Props {
  professional: ProfessionalData;
  contact: ContactData | null;
  currentCategoryId: string | null;
  categories: CategoryOption[];
  localities: LocalityOption[];
  publicPath?: string;
}

export function AdminProfessionalEditForm({
  professional,
  contact,
  currentCategoryId,
  categories,
  localities,
  publicPath,
}: Props) {
  const [state, formAction, isPending] = useActionState<AdminEditActionResult | null, FormData>(
    adminUpdateProfessionalAction,
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="professional_id" value={professional.id} />

      {state?.message && (
        <Alert variant={state.success ? "success" : "error"}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>{state.message}</span>
            {state.success && publicPath && (
              <Link
                href={publicPath}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline font-bold hover:text-white"
              >
                Ver ficha en vivo ↗
              </Link>
            )}
          </div>
        </Alert>
      )}

      {/* Nombre Comercial y Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Nombre Comercial / Razón Social *"
            name="business_name"
            defaultValue={professional.business_name}
            placeholder="Ej: Plomería y Gas Express PLC"
            required
            error={state?.errors?.business_name?.[0]}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Identificador actual (slug):{" "}
            <code className="text-slate-300 font-mono">{professional.slug}</code>
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Estado de Aprobación *
          </label>
          <select
            name="status"
            defaultValue={professional.status}
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="approved">Aprobado (Visible al público)</option>
            <option value="pending">Pendiente de revisión</option>
            <option value="rejected">Rechazado</option>
            <option value="suspended">Suspendido</option>
          </select>
          {state?.errors?.status && (
            <p className="text-xs text-red-400 mt-1">{state.errors.status[0]}</p>
          )}
        </div>
      </div>

      {/* Oficio y Ciudad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Oficio / Categoría Principal *
          </label>
          <select
            name="category_id"
            defaultValue={currentCategoryId || ""}
            required
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="" disabled>
              Selecciona una categoría...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state?.errors?.category_id && (
            <p className="text-xs text-red-400 mt-1">{state.errors.category_id[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Ciudad Base (Anzoátegui) *
          </label>
          <select
            name="locality_id"
            defaultValue={professional.locality_id || ""}
            required
            className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="" disabled>
              Selecciona una localidad...
            </option>
            {localities.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} {loc.municipality_name ? `(${loc.municipality_name})` : ""}
              </option>
            ))}
          </select>
          {state?.errors?.locality_id && (
            <p className="text-xs text-red-400 mt-1">{state.errors.locality_id[0]}</p>
          )}
        </div>
      </div>

      {/* Contactos y Experiencia */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Input
            label="WhatsApp Directo *"
            name="whatsapp_phone"
            defaultValue={contact?.whatsapp_phone || ""}
            placeholder="Ej: 0414-1234567 o +584141234567"
            required
            error={state?.errors?.whatsapp_phone?.[0]}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Se normaliza automáticamente a formato internacional +58.
          </p>
        </div>

        <div>
          <Input
            label="Teléfono de Llamadas (Opcional)"
            name="phone"
            defaultValue={contact?.phone || ""}
            placeholder="Ej: 0281-2861234 o vacío"
            error={state?.errors?.phone?.[0]}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Déjalo vacío si solo atiende por WhatsApp.
          </p>
        </div>

        <div>
          <Input
            label="Años de Experiencia *"
            name="experience_years"
            type="number"
            min={0}
            max={80}
            defaultValue={professional.experience_years ?? 5}
            required
            error={state?.errors?.experience_years?.[0]}
          />
        </div>
      </div>

      {/* Persona de Contacto y Redes Sociales */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Persona de Contacto y Redes Sociales (Opcional)
        </h3>

        <Input
          label="Nombre y Apellido de Contacto"
          name="contact_person_name"
          defaultValue={professional.contact_person_name || ""}
          placeholder="Ej: Carlos Pérez"
          error={state?.errors?.contact_person_name?.[0]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Instagram"
            name="instagram_handle"
            defaultValue={professional.instagram_handle || ""}
            placeholder="Ej: @tu_negocio o tu_negocio"
            error={state?.errors?.instagram_handle?.[0]}
          />

          <Input
            label="TikTok"
            name="tiktok_handle"
            defaultValue={professional.tiktok_handle || ""}
            placeholder="Ej: @tu_negocio o tu_negocio"
            error={state?.errors?.tiktok_handle?.[0]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Página de Facebook"
            name="facebook_url"
            defaultValue={professional.facebook_url || ""}
            placeholder="https://facebook.com/tu-pagina"
            error={state?.errors?.facebook_url?.[0]}
          />

          <Input
            label="Sitio Web Oficial"
            name="website_url"
            defaultValue={professional.website_url || ""}
            placeholder="https://www.tuempresa.com"
            error={state?.errors?.website_url?.[0]}
          />
        </div>
      </div>

      {/* Descripción de servicios */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Descripción del Profesional y Servicios Ofrecidos
        </label>
        <textarea
          name="description"
          rows={5}
          defaultValue={professional.description || ""}
          placeholder="Describe la experiencia, servicios prestados, disponibilidad y especialidades del técnico o empresa..."
          className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
        />
        {state?.errors?.description && (
          <p className="text-xs text-red-400 mt-1">{state.errors.description[0]}</p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/profesionales"
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Volver al listado
          </Link>
          {publicPath && (
            <Link
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Ver perfil público ↗
            </Link>
          )}
        </div>

        <Button type="submit" isLoading={isPending} className="w-full sm:w-auto">
          {isPending ? "Guardando cambios..." : "Guardar Cambios de la Ficha"}
        </Button>
      </div>
    </form>
  );
}
