"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { saveProfileAction, ProfileActionState } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface LocalityOption {
  id: string;
  name: string;
  slug: string;
}

export interface GroupedLocalityOption {
  municipalityName: string;
  stateName: string;
  localities: LocalityOption[];
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface InitialProfileData {
  id?: string;
  provider_type?: "individual" | "company";
  id_type?: string | null;
  id_number?: string | null;
  business_name?: string;
  locality_id?: string | null;
  category_id?: string | null;
  description?: string | null;
  experience_years?: number | null;
  whatsapp_phone?: string | null;
  phone?: string | null;
  status?: string;
  contact_person_name?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  facebook_url?: string | null;
  website_url?: string | null;
}

interface ProfileFormProps {
  initialData?: InitialProfileData | null;
  localities?: LocalityOption[];
  groupedLocalities?: GroupedLocalityOption[];
  categories: CategoryOption[];
}

export function ProfileForm({
  initialData,
  localities = [],
  groupedLocalities = [],
  categories,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<ProfileActionState | null, FormData>(
    saveProfileAction,
    null
  );

  // Estado para alternar dinámicamente entre Técnico y Empresa
  const [providerType, setProviderType] = useState<"individual" | "company">(
    initialData?.provider_type || "individual"
  );

  // Tipo de documento (V/E para individual, J/G para company)
  const defaultIdType =
    initialData?.id_type || (providerType === "company" ? "J" : "V");
  const [idType, setIdType] = useState<string>(defaultIdType);

  const handleProviderTypeChange = (type: "individual" | "company") => {
    setProviderType(type);
    if (type === "individual" && (idType === "J" || idType === "G")) {
      setIdType("V");
    } else if (type === "company" && (idType === "V" || idType === "E")) {
      setIdType("J");
    }
  };

  return (
    <form action={formAction} className="space-y-8">
      {/* Alertas de resultado */}
      {state?.message && !state.success && (
        <Alert variant="error" title="No se pudo guardar">
          {state.message}
        </Alert>
      )}

      {state?.success && state.message && (
        <Alert variant="success" title="¡Operación exitosa!">
          <div className="space-y-2">
            <p>{state.message}</p>
            <Link
              href="/panel"
              className="inline-block text-xs font-bold underline hover:opacity-80"
            >
              Volver al resumen del panel
            </Link>
          </div>
        </Alert>
      )}

      {/* SECCIÓN 1: TIPO DE PRESTADOR */}
      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-brand-text-primary">
            1. Tipo de Prestador de Servicios
          </h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Indica si ofreces tus servicios a título personal o como una empresa establecida.
          </p>
        </div>

        <input type="hidden" name="provider_type" value={providerType} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleProviderTypeChange("individual")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              providerType === "individual"
                ? "border-brand-primary bg-brand-surface-soft shadow-xs"
                : "border-brand-border bg-brand-surface hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-bold text-sm text-brand-text-primary">
                  Técnico Independiente
                </p>
                <p className="text-xs text-brand-text-muted">
                  Profesional autónomo, electricista, plomero, técnico particular.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleProviderTypeChange("company")}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              providerType === "company"
                ? "border-brand-primary bg-brand-surface-soft shadow-xs"
                : "border-brand-border bg-brand-surface hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏢</span>
              <div>
                <p className="font-bold text-sm text-brand-text-primary">
                  Empresa o Taller
                </p>
                <p className="text-xs text-brand-text-muted">
                  Compañía registrada, taller de refrigeración, contratista de servicios.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* SECCIÓN 2: IDENTIFICACIÓN Y NOMBRE */}
      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-brand-text-primary">
            2. Identificación y Nombre Comercial
          </h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Datos legales e identidad con la que los clientes te reconocerán.
          </p>
        </div>

        {/* Cédula o RIF */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-brand-text-primary">
            {providerType === "company" ? "RIF de la Empresa *" : "Documento de Identidad (Cédula / RIF) *"}
          </label>
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
              <select
                name="id_type"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              >
                {providerType === "individual" ? (
                  <>
                    <option value="V">V - Venezolano</option>
                    <option value="E">E - Extranjero</option>
                  </>
                ) : (
                  <>
                    <option value="J">J - Jurídico</option>
                    <option value="G">G - Gubernamental</option>
                  </>
                )}
              </select>
            </div>
            <div className="col-span-3">
              <input
                type="text"
                name="id_number"
                defaultValue={initialData?.id_number || ""}
                placeholder="Ej: 12345678"
                maxLength={10}
                required
                className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary placeholder:text-brand-text-muted/60"
              />
            </div>
          </div>
          {state?.errors?.id_number && (
            <p className="text-xs text-brand-danger">{state.errors.id_number[0]}</p>
          )}
          <p className="text-[11px] text-brand-text-muted mt-1.5 flex items-start sm:items-center gap-1.5">
            <span className="text-xs">🔒</span>
            <span>
              Tu cédula o RIF no se muestra públicamente. Solo tú y los administradores pueden verla. La usamos para evitar perfiles falsos.{" "}
              <Link
                href="/privacidad"
                className="text-brand-accent-dark font-medium underline hover:text-brand-accent"
                target="_blank"
              >
                Más información en privacidad
              </Link>
            </span>
          </p>
        </div>

        {/* Nombre Comercial */}
        <Input
          label={
            providerType === "company"
              ? "Nombre de la Empresa o Razón Social *"
              : "Nombre Comercial o Nombre Profesional *"
          }
          name="business_name"
          defaultValue={initialData?.business_name || ""}
          placeholder={
            providerType === "company"
              ? "Ej: Multiservicios Clima Oriente C.A."
              : "Ej: Refrigeración y Servicios Pedro Pérez"
          }
          required
          error={state?.errors?.business_name?.[0]}
          helperText="Así aparecerás en el directorio y en los resultados de búsqueda."
        />
      </div>

      {/* SECCIÓN 3: UBICACIÓN Y CATEGORÍA */}
      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-brand-text-primary">
            3. Especialidad y Ubicación Base
          </h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Indica tu área técnica principal y la ciudad base desde donde operas en Anzoátegui.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Categoría */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-brand-text-primary">
              Categoría Principal de Servicio *
            </label>
            <select
              name="category_id"
              defaultValue={initialData?.category_id || ""}
              required
              className="w-full px-3 py-2.5 text-sm bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              <option value="" disabled>
                -- Selecciona una categoría --
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {state?.errors?.category_id && (
              <p className="text-xs text-brand-danger">
                {state.errors.category_id[0]}
              </p>
            )}
          </div>

          {/* Localidad Base */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-brand-text-primary">
              Ciudad / Localidad Base *
            </label>
            <select
              name="locality_id"
              defaultValue={initialData?.locality_id || ""}
              required
              className="w-full px-3 py-2.5 text-sm bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              <option value="" disabled>
                -- Selecciona tu ciudad o zona base --
              </option>
              {groupedLocalities && groupedLocalities.length > 0
                ? groupedLocalities.map((group) => (
                    <optgroup
                      key={`${group.stateName}-${group.municipalityName}`}
                      label={`Municipio ${group.municipalityName} (${group.stateName})`}
                    >
                      {group.localities.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : localities.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} (Anzoátegui)
                    </option>
                  ))}
            </select>
            {state?.errors?.locality_id && (
              <p className="text-xs text-brand-danger">
                {state.errors.locality_id[0]}
              </p>
            )}
          </div>
        </div>

        {/* Años de Experiencia */}
        <div className="max-w-xs space-y-1">
          <label className="block text-xs font-semibold text-brand-text-primary">
            Años de Experiencia en el Rubro *
          </label>
          <input
            type="number"
            name="experience_years"
            min={0}
            max={80}
            defaultValue={initialData?.experience_years ?? 3}
            required
            className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
          {state?.errors?.experience_years && (
            <p className="text-xs text-brand-danger">
              {state.errors.experience_years[0]}
            </p>
          )}
        </div>
      </div>

      {/* SECCIÓN 4: INFORMACIÓN DE CONTACTO PRIVADA */}
      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-brand-text-primary">
              4. Canales de Contacto Directo
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              Protegidos contra Spam
            </span>
          </div>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Tus números no se exponen en texto plano. Se entregan únicamente a clientes que pulsan el botón de contacto tras validar las cuotas del sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Número de WhatsApp (Principal) *"
            name="whatsapp_phone"
            defaultValue={initialData?.whatsapp_phone || ""}
            placeholder="0414-1234567 o +584141234567"
            required
            error={state?.errors?.whatsapp_phone?.[0]}
            helperText="Formato venezolano de 11 dígitos o formato internacional +58."
          />

          <Input
            label="Teléfono Secundario para Llamadas (Opcional)"
            name="phone"
            defaultValue={initialData?.phone || ""}
            placeholder="0281-1234567 o 0424-1234567"
            error={state?.errors?.phone?.[0]}
            helperText="Teléfono fijo o móvil alternativo."
          />
        </div>
      </div>

      {/* SECCIÓN 5: PERSONA DE CONTACTO Y REDES SOCIALES */}
      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-brand-text-primary">
            5. Persona de Contacto y Redes Sociales (Opcional)
          </h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Brinda mayor confianza mostrando quién atiende y los canales oficiales donde los clientes pueden ver tus trabajos.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Nombre y Apellido de Contacto"
            name="contact_person_name"
            defaultValue={initialData?.contact_person_name || ""}
            placeholder={
              providerType === "company"
                ? "Ej: Ing. Carlos Pérez (Gerente / Coordinador)"
                : "Ej: Pedro Pérez"
            }
            error={state?.errors?.contact_person_name?.[0]}
            helperText="Aparecerá en tu ficha pública para que los clientes sepan a quién se dirigen."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Instagram"
              name="instagram_handle"
              defaultValue={initialData?.instagram_handle || ""}
              placeholder="Ej: @tu_negocio o tu_negocio"
              error={state?.errors?.instagram_handle?.[0]}
              helperText="Usuario de Instagram. Se limpiará el @ automáticamente."
            />

            <Input
              label="TikTok"
              name="tiktok_handle"
              defaultValue={initialData?.tiktok_handle || ""}
              placeholder="Ej: @tu_negocio o tu_negocio"
              error={state?.errors?.tiktok_handle?.[0]}
              helperText="Usuario de TikTok sin espacios."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Página de Facebook"
              name="facebook_url"
              defaultValue={initialData?.facebook_url || ""}
              placeholder="https://facebook.com/tu-pagina"
              error={state?.errors?.facebook_url?.[0]}
              helperText="Enlace completo con https://"
            />

            <Input
              label="Sitio Web Oficial"
              name="website_url"
              defaultValue={initialData?.website_url || ""}
              placeholder="https://www.tuempresa.com"
              error={state?.errors?.website_url?.[0]}
              helperText="Tu dominio o página web externa (con https://)."
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 6: DESCRIPCIÓN Y BIO */}
      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-brand-text-primary">
            6. Descripción de tus Servicios
          </h2>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Explica qué trabajos realizas, si atiendes emergencias, marcas con las que trabajas y tu garantía.
          </p>
        </div>

        <div className="space-y-1">
          <textarea
            name="description"
            rows={5}
            defaultValue={initialData?.description || ""}
            placeholder="Ej: Especialistas en instalación, mantenimiento preventivo y correctivo de aires tipo split, ventana y centrales. Recarga de gas refrigerante, detección de fugas y cambio de compresores. Atendemos emergencias en Puerto La Cruz, Barcelona y Lechería con garantía por escrito."
            className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-xl text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary placeholder:text-brand-text-muted/60"
          ></textarea>
          {state?.errors?.description && (
            <p className="text-xs text-brand-danger">
              {state.errors.description[0]}
            </p>
          )}
        </div>
      </div>

      {/* BOTÓN DE GUARDADO */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
        <Link
          href="/panel"
          className="px-4 py-2 text-sm font-semibold text-brand-text-muted hover:text-brand-text-primary transition-colors"
        >
          Cancelar
        </Link>
        <Button type="submit" isLoading={isPending} className="min-w-[160px]">
          {initialData?.id ? "Actualizar Perfil" : "Guardar y Enviar a Revisión"}
        </Button>
      </div>
    </form>
  );
}
