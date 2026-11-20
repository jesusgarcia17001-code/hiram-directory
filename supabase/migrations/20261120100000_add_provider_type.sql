-- =====================================================================
-- MIGRACIÓN: Soporte para Técnicos Independientes y Empresas / Talleres
-- =====================================================================

-- 1. Tipo ENUM para tipo de prestador
create type public.provider_type as enum ('individual', 'company');

-- 2. Columnas en la tabla professionals
alter table public.professionals
  add column provider_type public.provider_type not null default 'individual',
  add column id_type text check (id_type is null or id_type in ('V', 'E', 'J', 'G')),
  add column id_number text check (id_number is null or id_number ~ '^[0-9]{5,10}$');

-- 3. Permisos para que los usuarios autenticados puedan escribir estas columnas
grant insert (provider_type, id_type, id_number) on public.professionals to authenticated;
grant update (provider_type, id_type, id_number) on public.professionals to authenticated;

-- 4. Actualizar la vista pública professionals_public para exponer provider_type
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
  private.contacts_enabled(p.id) as contacts_enabled,
  exists (
    select 1 from public.featured_listings f
    where f.professional_id = p.id
      and f.starts_at <= now() and f.ends_at > now()
  ) as is_featured
from public.professionals p
where p.status = 'approved';

grant select on public.professionals_public to anon, authenticated;
