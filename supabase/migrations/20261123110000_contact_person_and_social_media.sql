-- =====================================================================
-- MIGRACIÓN: Nombre de Persona de Contacto y Redes Sociales en Perfiles
-- =====================================================================

-- 1. Agregar columnas en la tabla professionals con restricciones CHECK
alter table public.professionals
  -- Nombre y apellido de la persona de contacto (opcional, entre 2 y 80 caracteres)
  add column if not exists contact_person_name text check (
    contact_person_name is null 
    or (char_length(trim(contact_person_name)) >= 2 and char_length(contact_person_name) <= 80)
  ),
  -- Handles de Instagram y TikTok (opcionales, max 30 caracteres, solo letras, números, punto y guion bajo)
  add column if not exists instagram_handle text check (
    instagram_handle is null 
    or instagram_handle ~ '^[a-zA-Z0-9._]{1,30}$'
  ),
  add column if not exists tiktok_handle text check (
    tiktok_handle is null 
    or tiktok_handle ~ '^[a-zA-Z0-9._]{1,30}$'
  ),
  -- URLs de Facebook y Sitio Web (opcionales, deben iniciar estrictamente con https://, max 200 caracteres)
  add column if not exists facebook_url text check (
    facebook_url is null 
    or (facebook_url ~ '^https://' and char_length(facebook_url) <= 200)
  ),
  add column if not exists website_url text check (
    website_url is null 
    or (website_url ~ '^https://' and char_length(website_url) <= 200)
  );

-- 2. Permisos a nivel de columna para usuarios autenticados (profesionales dueños de su perfil)
-- REGLA CLAUDE.md: Permisos cerrados por defecto; otorgar GRANT explícito por columna.
grant insert (contact_person_name, instagram_handle, tiktok_handle, facebook_url, website_url)
  on public.professionals to authenticated;

grant update (contact_person_name, instagram_handle, tiktok_handle, facebook_url, website_url)
  on public.professionals to authenticated;

-- 3. Recrear la vista pública professionals_public
-- REGLA DE SEGURIDAD (CLAUDE.md):
-- Exponer los nuevos campos públicos, pero NUNCA exponer cédula/RIF (id_type, id_number),
-- ni owner_id, ni notas internas.
drop view if exists public.professionals_public;

create view public.professionals_public as
select
  p.id,
  p.slug,
  p.business_name,
  p.description,
  p.logo_path,
  p.locality_id,
  p.service_areas,
  p.experience_years,
  p.working_hours,
  p.availability,
  p.created_at,
  p.provider_type,
  -- Nuevos campos públicos
  p.contact_person_name,
  p.instagram_handle,
  p.tiktok_handle,
  p.facebook_url,
  p.website_url,
  -- Contactos protegidos y destacado
  private.contacts_enabled(p.id) as contacts_enabled,
  exists (
    select 1 from public.featured_listings f
    where f.professional_id = p.id
      and f.starts_at <= now() and f.ends_at > now()
  ) as is_featured
from public.professionals p
where p.status = 'approved';

grant select on public.professionals_public to anon, authenticated;
