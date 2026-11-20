-- =====================================================================
-- HIRAM DIRECTORY - MIGRACIÓN INICIAL (Fase 0) - versión corregida
-- Para Supabase PostgreSQL. Ejecutar UNA sola vez en un proyecto nuevo.
--
-- Cambios importantes respecto al SQL original:
--  * Trigger que crea user_profiles al registrarse (faltaba).
--  * is_admin() movida al esquema "private" (no queda expuesta como RPC).
--  * Profesionales NO pueden tocar status / approved_* / owner_id
--    (permisos por columna + trigger de defensa).
--  * Aprobar/rechazar/suspender solo con la función admin_set_professional_status.
--  * Tabla professionals no es pública: el público lee la vista professionals_public
--    (sin owner_id ni datos administrativos).
--  * Ubicaciones normalizadas: estado > municipio > localidad.
--  * Tablas que faltaban: services, payment_receipts, featured_listings,
--    notifications, reports, app_settings.
--  * Eventos con 'impression' y reglas de cuota gratuita permanentes.
--  * Auditoría automática por triggers.
--  * Buckets de Storage y sus políticas.
--  * Permisos de tablas cerrados por defecto (RLS + GRANT por columna).
--
-- Las funciones que registran visitas/contactos (Fase 4) y pagos
-- (Fase 5) se añadirán en migraciones posteriores.
-- =====================================================================

create extension if not exists pgcrypto;

create schema if not exists private;

-- ---------------------------------------------------------------------
-- 1. TIPOS
-- ---------------------------------------------------------------------

create type public.app_role as enum ('user', 'admin');

create type public.professional_status as enum
  ('pending', 'approved', 'rejected', 'suspended');

create type public.subscription_status as enum
  ('pending', 'active', 'expired', 'suspended');

create type public.payment_status as enum
  ('pending', 'approved', 'rejected');

create type public.profile_event_type as enum
  ('impression', 'visit', 'whatsapp_click', 'call_click');

create type public.report_status as enum
  ('open', 'reviewing', 'resolved', 'dismissed');

-- ---------------------------------------------------------------------
-- 2. USUARIOS
-- ---------------------------------------------------------------------

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  email text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. UBICACIONES (estado > municipio > localidad)
-- ---------------------------------------------------------------------

create table public.states (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.municipalities (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references public.states(id) on delete restrict,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (state_id, slug),
  unique (state_id, name)
);

create table public.localities (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null
    references public.municipalities(id) on delete restrict,
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (municipality_id, name)
);

create index localities_municipality_idx on public.localities(municipality_id);

-- ---------------------------------------------------------------------
-- 4. CATEGORÍAS Y SERVICIOS (catálogo)
-- ---------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  -- Datos para SEO de las páginas de lista (ej. /plomeros/puerto-la-cruz)
  listing_slug text not null unique,
  singular_label text not null,
  plural_label text not null,
  seo_intro text,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);

-- ---------------------------------------------------------------------
-- 5. PROFESIONALES
-- ---------------------------------------------------------------------

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique
    references public.user_profiles(id) on delete cascade,

  business_name text not null
    check (char_length(business_name) between 2 and 120),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  description text check (description is null or char_length(description) <= 3000),
  logo_path text,
  locality_id uuid references public.localities(id),
  service_areas text[] not null default '{}'
    check (cardinality(service_areas) <= 20),
  experience_years integer
    check (experience_years is null or experience_years between 0 and 80),
  working_hours jsonb not null default '{}'::jsonb
    check (jsonb_typeof(working_hours) = 'object'),
  availability text not null default 'available'
    check (availability in ('available', 'busy', 'unavailable')),

  status public.professional_status not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references public.user_profiles(id),

  terms_accepted_at timestamptz not null default now(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index professionals_status_idx on public.professionals(status);
create index professionals_locality_idx on public.professionals(locality_id);

-- ---------------------------------------------------------------------
-- 6. CONTACTOS PRIVADOS (nunca públicos)
-- ---------------------------------------------------------------------

create table public.professional_contacts (
  professional_id uuid primary key
    references public.professionals(id) on delete cascade,
  -- Formato internacional E.164, por ejemplo +584141234567
  whatsapp_phone text
    check (whatsapp_phone is null or whatsapp_phone ~ '^\+[1-9][0-9]{7,14}$'),
  phone text
    check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 7. CATEGORÍAS, SERVICIOS Y FOTOS DEL PROFESIONAL
-- ---------------------------------------------------------------------

create table public.professional_categories (
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  category_id uuid not null
    references public.categories(id) on delete cascade,
  primary key (professional_id, category_id)
);

create index professional_categories_category_idx
  on public.professional_categories(category_id);

create table public.professional_services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  description text check (description is null or char_length(description) <= 1000),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index professional_services_professional_idx
  on public.professional_services(professional_id);

create table public.professional_photos (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  -- Ruta dentro del bucket "professional-media": {professional_id}/archivo.webp
  image_path text not null,
  caption text check (caption is null or char_length(caption) <= 200),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index professional_photos_professional_idx
  on public.professional_photos(professional_id, sort_order);

-- ---------------------------------------------------------------------
-- 8. PLANES, SUSCRIPCIONES Y PAGOS
-- ---------------------------------------------------------------------

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0,
  currency text not null default 'USD',
  duration_days integer not null default 30,
  features jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint plans_price_positive check (price >= 0),
  constraint plans_duration_positive check (duration_days > 0)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status public.subscription_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz,
  activated_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, professional_id),

  constraint valid_subscription_dates check (
    ends_at is null or starts_at is null or ends_at > starts_at
  ),
  -- Una suscripción activa siempre debe tener fechas.
  constraint active_subscription_has_dates check (
    status <> 'active' or (starts_at is not null and ends_at is not null)
  )
);

create index subscriptions_professional_idx
  on public.subscriptions(professional_id, status);

-- Impide dos suscripciones activas simultáneas.
create unique index one_active_subscription_per_professional
  on public.subscriptions(professional_id)
  where status = 'active';

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id),
  subscription_id uuid,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  payment_method text not null,
  reference_number text,
  status public.payment_status not null default 'pending',
  reviewed_by uuid references public.user_profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),

  constraint payments_amount_positive check (amount > 0),
  -- La suscripción debe pertenecer al mismo profesional.
  constraint payments_subscription_same_professional
    foreign key (subscription_id, professional_id)
    references public.subscriptions(id, professional_id),
  -- Un pago revisado debe tener revisor y fecha.
  constraint payments_review_complete check (
    status = 'pending' or (reviewed_by is not null and reviewed_at is not null)
  ),
  constraint payments_rejection_reason check (
    status <> 'rejected' or rejection_reason is not null
  )
);

create index payments_professional_idx on public.payments(professional_id);
create index payments_status_idx on public.payments(status);

-- Evita reutilizar la misma referencia de pago.
create unique index payments_unique_reference
  on public.payments (lower(payment_method), lower(reference_number))
  where reference_number is not null and status in ('pending', 'approved');

-- Comprobantes (archivos en el bucket privado "payment-receipts").
create table public.payment_receipts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create index payment_receipts_payment_idx on public.payment_receipts(payment_id);

-- ---------------------------------------------------------------------
-- 9. EVENTOS DE PERFIL (visitas y contactos)
-- ---------------------------------------------------------------------
-- Reglas del límite gratuito (acumulado, permanente):
--  * Visita única: una por visitante y perfil, para siempre.
--  * Contacto único: una por visitante y perfil (WhatsApp + llamada = 1).
--  * Solo cuentan eventos con counts_toward_free_quota = true
--    (no se cuentan durante un período de suscripción activa).
-- Todo se escribe únicamente desde el servidor (Fase 4).

create table public.profile_events (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  event_type public.profile_event_type not null,

  -- HMAC generado por el servidor. No se guarda IP ni datos personales.
  visitor_hash text not null,
  -- Evita duplicados por reintentos de red.
  dedupe_key text not null unique,

  channel text,
  counts_toward_free_quota boolean not null default false,
  -- Primer contacto de ese visitante a ese perfil (cuenta para el límite).
  is_quota_contact boolean not null default false,

  created_at timestamptz not null default now(),

  constraint valid_event_channel check (
    (event_type = 'whatsapp_click' and channel = 'whatsapp')
    or (event_type = 'call_click' and channel = 'call')
    or (event_type in ('visit', 'impression') and channel is null)
  ),
  constraint impression_not_counted check (
    event_type <> 'impression' or counts_toward_free_quota = false
  ),
  constraint quota_contact_only_clicks check (
    not is_quota_contact
    or (event_type in ('whatsapp_click', 'call_click')
        and counts_toward_free_quota)
  )
);

create index profile_events_professional_idx
  on public.profile_events(professional_id, event_type);
create index profile_events_date_idx on public.profile_events(created_at);

-- Una visita por visitante y perfil, para siempre.
create unique index profile_events_one_visit_per_visitor
  on public.profile_events(professional_id, visitor_hash)
  where event_type = 'visit';

-- Un contacto contabilizado por visitante y perfil.
create unique index profile_events_one_quota_contact_per_visitor
  on public.profile_events(professional_id, visitor_hash)
  where is_quota_contact;

-- Índices para contar rápido el consumo de la cuota gratuita.
create index profile_events_quota_visits_idx
  on public.profile_events(professional_id)
  where event_type = 'visit' and counts_toward_free_quota;

create index profile_events_quota_contacts_idx
  on public.profile_events(professional_id)
  where is_quota_contact;

-- ---------------------------------------------------------------------
-- 10. DESTACADOS, NOTIFICACIONES, REPORTES, AJUSTES, AUDITORÍA
-- ---------------------------------------------------------------------

create table public.featured_listings (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  position integer not null default 0,
  created_by uuid references public.user_profiles(id),
  created_at timestamptz not null default now(),
  constraint featured_dates check (ends_at > starts_at)
);

create index featured_listings_active_idx
  on public.featured_listings(professional_id, starts_at, ends_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, read_at);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id) on delete cascade,
  reason text not null check (char_length(reason) <= 100),
  details text check (details is null or char_length(details) <= 2000),
  reporter_contact text check (
    reporter_contact is null or char_length(reporter_contact) <= 200
  ),
  status public.report_status not null default 'open',
  resolved_by uuid references public.user_profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports(status);

-- Ajustes editables desde administración (por ejemplo, los límites gratuitos).
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.user_profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_logs_date_idx on public.audit_logs(created_at);

-- ---------------------------------------------------------------------
-- 11. FUNCIONES AUXILIARES (esquema private, no expuesto por la API)
-- ---------------------------------------------------------------------

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function private.owns_professional(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.professionals
    where id = p_professional_id and owner_id = (select auth.uid())
  );
$$;

create or replace function private.can_view_professional(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.professionals p
    where p.id = p_professional_id
      and (
        p.status = 'approved'
        or p.owner_id = (select auth.uid())
        or private.is_admin()
      )
  );
$$;

-- Devuelve el id del profesional escrito en la primera carpeta de una ruta
-- de Storage, o null si no es un uuid válido.
create or replace function private.storage_professional_id(p_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return (string_to_array(p_name, '/'))[1]::uuid;
exception when others then
  return null;
end;
$$;

create or replace function private.has_active_subscription(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.professional_id = p_professional_id
      and s.status = 'active'
      and s.starts_at <= now()
      and s.ends_at > now()
  );
$$;

-- Consumo de la cuota gratuita acumulada y sus límites.
create or replace function private.free_quota(p_professional_id uuid)
returns table (
  visits integer,
  contacts integer,
  visit_limit integer,
  contact_limit integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::int from public.profile_events e
      where e.professional_id = p_professional_id
        and e.event_type = 'visit' and e.counts_toward_free_quota),
    (select count(*)::int from public.profile_events e
      where e.professional_id = p_professional_id and e.is_quota_contact),
    coalesce((select (s.value #>> '{}')::int from public.app_settings s
              where s.key = 'free_visit_limit'), 10),
    coalesce((select (s.value #>> '{}')::int from public.app_settings s
              where s.key = 'free_contact_limit'), 5);
$$;

-- ¿Están habilitados los contactos de este perfil?
create or replace function private.contacts_enabled(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.has_active_subscription(p_professional_id)
    or (
      select q.visits < q.visit_limit and q.contacts < q.contact_limit
      from private.free_quota(p_professional_id) q
    );
$$;

-- ---------------------------------------------------------------------
-- 12. TRIGGERS
-- ---------------------------------------------------------------------

-- 12.1 updated_at automático
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.user_profiles
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.professionals
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.professional_contacts
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.subscriptions
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.app_settings
  for each row execute function private.set_updated_at();

-- 12.2 Crear user_profiles al registrarse (rol siempre 'user')
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- 12.3 Nadie puede cambiar un rol desde la API (solo SQL / service_role)
create or replace function private.protect_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
     and new.role is distinct from old.role then
    raise exception 'No autorizado: el rol no se puede modificar'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_user_profile before update on public.user_profiles
  for each row execute function private.protect_user_profile();

-- 12.4 Defensa de profesionales: campos administrativos protegidos
create or replace function private.protect_professional()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() es null en SQL Editor y service_role (contexto de confianza).
  if (select auth.uid()) is not null and not private.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.approved_at := null;
      new.approved_by := null;
    else
      if new.owner_id is distinct from old.owner_id
         or new.status is distinct from old.status
         or new.approved_at is distinct from old.approved_at
         or new.approved_by is distinct from old.approved_by then
        raise exception 'No autorizado: campos administrativos protegidos'
          using errcode = '42501';
      end if;
      -- La URL pública no cambia una vez que el perfil salió de "pending".
      if new.slug is distinct from old.slug and old.status <> 'pending' then
        raise exception 'No autorizado: la URL del perfil no puede cambiarse'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_professional
  before insert or update on public.professionals
  for each row execute function private.protect_professional();

-- 12.5 Auditoría automática de acciones administrativas / del sistema
create or replace function private.audit_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  -- Se registran acciones de administradores y del sistema (service_role / SQL).
  if v_actor is not null and not private.is_admin() then
    return null;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    v_actor,
    lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    jsonb_strip_nulls(jsonb_build_object(
      'old', case when tg_op <> 'INSERT' then to_jsonb(old) end,
      'new', case when tg_op <> 'DELETE' then to_jsonb(new) end,
      'note', nullif(current_setting('app.audit_note', true), '')
    ))
  );
  return null;
end;
$$;

create trigger audit_professional_status
  after update on public.professionals
  for each row when (old.status is distinct from new.status)
  execute function private.audit_changes();

create trigger audit_subscriptions
  after insert or update or delete on public.subscriptions
  for each row execute function private.audit_changes();

create trigger audit_payments
  after insert or update or delete on public.payments
  for each row execute function private.audit_changes();

create trigger audit_plans
  after insert or update or delete on public.plans
  for each row execute function private.audit_changes();

create trigger audit_user_profiles
  after update on public.user_profiles
  for each row when (old.role is distinct from new.role)
  execute function private.audit_changes();

-- ---------------------------------------------------------------------
-- 13. FUNCIÓN ADMINISTRATIVA: aprobar / rechazar / suspender perfiles
-- ---------------------------------------------------------------------

create or replace function public.admin_set_professional_status(
  p_professional_id uuid,
  p_status public.professional_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  perform set_config('app.audit_note', coalesce(p_note, ''), true);

  update public.professionals
  set status = p_status,
      approved_at = case when p_status = 'approved' then now() else approved_at end,
      approved_by = case when p_status = 'approved'
                         then (select auth.uid()) else approved_by end
  where id = p_professional_id;

  if not found then
    raise exception 'Profesional no encontrado' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 14. VISTAS PÚBLICAS (lo único que lee el público)
-- ---------------------------------------------------------------------
-- Estas vistas se ejecutan con los permisos de su dueño a propósito:
-- exponen solo columnas seguras de perfiles aprobados.
-- (El linter de Supabase puede avisar de "security definer view"; es intencional.)

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
  private.contacts_enabled(p.id) as contacts_enabled,
  exists (
    select 1 from public.featured_listings f
    where f.professional_id = p.id
      and f.starts_at <= now() and f.ends_at > now()
  ) as is_featured
from public.professionals p
where p.status = 'approved';

-- Combinaciones categoría + localidad que tienen al menos un profesional
-- aprobado. Sirve para publicar solo páginas de lista con contenido real
-- (y para el sitemap).
create view public.listing_combinations as
select
  c.id as category_id,
  c.listing_slug,
  c.plural_label,
  l.id as locality_id,
  l.slug as locality_slug,
  l.name as locality_name,
  m.slug as municipality_slug,
  m.name as municipality_name,
  count(distinct p.id)::int as professional_count
from public.professionals p
join public.professional_categories pc on pc.professional_id = p.id
join public.categories c on c.id = pc.category_id and c.is_active
join public.localities l on l.id = p.locality_id and l.is_active
join public.municipalities m on m.id = l.municipality_id and m.is_active
where p.status = 'approved'
group by c.id, c.listing_slug, c.plural_label,
         l.id, l.slug, l.name, m.slug, m.name;

-- ---------------------------------------------------------------------
-- 15. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.user_profiles enable row level security;
alter table public.states enable row level security;
alter table public.municipalities enable row level security;
alter table public.localities enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_contacts enable row level security;
alter table public.professional_categories enable row level security;
alter table public.professional_services enable row level security;
alter table public.professional_photos enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.payment_receipts enable row level security;
alter table public.profile_events enable row level security;
alter table public.featured_listings enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;

-- 15.1 Usuarios
create policy "Users read own profile" on public.user_profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());

create policy "Users update own profile" on public.user_profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- El rol no se puede cambiar: sin permiso de columna + trigger protect_user_profile.

-- 15.2 Ubicaciones, categorías y servicios (lectura pública, gestión admin)
create policy "Read active states" on public.states
  for select to anon, authenticated
  using (is_active or private.is_admin());
create policy "Admins manage states" on public.states
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "Read active municipalities" on public.municipalities
  for select to anon, authenticated
  using (is_active or private.is_admin());
create policy "Admins manage municipalities" on public.municipalities
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "Read active localities" on public.localities
  for select to anon, authenticated
  using (is_active or private.is_admin());
create policy "Admins manage localities" on public.localities
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "Read active categories" on public.categories
  for select to anon, authenticated
  using (is_active or private.is_admin());
create policy "Admins manage categories" on public.categories
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "Read active services" on public.services
  for select to anon, authenticated
  using (is_active or private.is_admin());
create policy "Admins manage services" on public.services
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- 15.3 Profesionales (tabla base: solo dueño y admin; el público usa la vista)
create policy "Owners and admins read professionals" on public.professionals
  for select to authenticated
  using (owner_id = (select auth.uid()) or private.is_admin());

create policy "Professionals create own profile" on public.professionals
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'pending');

create policy "Owners and admins update professionals" on public.professionals
  for update to authenticated
  using (owner_id = (select auth.uid()) or private.is_admin())
  with check (owner_id = (select auth.uid()) or private.is_admin());
-- Los campos status / approved_* / owner_id están protegidos por permisos de
-- columna y por el trigger protect_professional.

-- 15.4 Contactos privados
create policy "Owners and admins read contacts" on public.professional_contacts
  for select to authenticated
  using (private.owns_professional(professional_id) or private.is_admin());
create policy "Owners and admins insert contacts" on public.professional_contacts
  for insert to authenticated
  with check (private.owns_professional(professional_id) or private.is_admin());
create policy "Owners and admins update contacts" on public.professional_contacts
  for update to authenticated
  using (private.owns_professional(professional_id) or private.is_admin())
  with check (private.owns_professional(professional_id) or private.is_admin());

-- 15.5 Categorías, servicios y fotos del profesional
create policy "Read visible professional categories" on public.professional_categories
  for select to anon, authenticated
  using (private.can_view_professional(professional_id));
create policy "Owners manage professional categories insert" on public.professional_categories
  for insert to authenticated
  with check (private.owns_professional(professional_id) or private.is_admin());
create policy "Owners manage professional categories delete" on public.professional_categories
  for delete to authenticated
  using (private.owns_professional(professional_id) or private.is_admin());

create policy "Read visible professional services" on public.professional_services
  for select to anon, authenticated
  using (
    private.can_view_professional(professional_id)
    and (is_active or private.owns_professional(professional_id) or private.is_admin())
  );
create policy "Owners manage professional services insert" on public.professional_services
  for insert to authenticated
  with check (private.owns_professional(professional_id) or private.is_admin());
create policy "Owners manage professional services update" on public.professional_services
  for update to authenticated
  using (private.owns_professional(professional_id) or private.is_admin())
  with check (private.owns_professional(professional_id) or private.is_admin());
create policy "Owners manage professional services delete" on public.professional_services
  for delete to authenticated
  using (private.owns_professional(professional_id) or private.is_admin());

create policy "Read visible professional photos" on public.professional_photos
  for select to anon, authenticated
  using (private.can_view_professional(professional_id));
create policy "Owners manage professional photos insert" on public.professional_photos
  for insert to authenticated
  with check (private.owns_professional(professional_id) or private.is_admin());
create policy "Owners manage professional photos update" on public.professional_photos
  for update to authenticated
  using (private.owns_professional(professional_id) or private.is_admin())
  with check (private.owns_professional(professional_id) or private.is_admin());
create policy "Owners manage professional photos delete" on public.professional_photos
  for delete to authenticated
  using (private.owns_professional(professional_id) or private.is_admin());

-- 15.6 Planes
create policy "Read active plans" on public.plans
  for select to anon, authenticated
  using (is_active or private.is_admin());
create policy "Admins manage plans" on public.plans
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- 15.7 Suscripciones, pagos y comprobantes (solo lectura desde la API;
--      toda escritura pasa por funciones del servidor, Fases 4-5)
create policy "Owners read own subscriptions" on public.subscriptions
  for select to authenticated
  using (private.owns_professional(professional_id) or private.is_admin());

create policy "Owners read own payments" on public.payments
  for select to authenticated
  using (private.owns_professional(professional_id) or private.is_admin());

create policy "Owners read own receipts" on public.payment_receipts
  for select to authenticated
  using (
    exists (
      select 1 from public.payments pay
      where pay.id = payment_id
        and (private.owns_professional(pay.professional_id) or private.is_admin())
    )
  );

-- 15.8 Eventos (solo lectura para dueño/admin; escritura solo servidor)
create policy "Owners read own profile metrics" on public.profile_events
  for select to authenticated
  using (private.owns_professional(professional_id) or private.is_admin());

-- 15.9 Destacados
create policy "Owners read own featured" on public.featured_listings
  for select to authenticated
  using (private.owns_professional(professional_id) or private.is_admin());
create policy "Admins manage featured" on public.featured_listings
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- 15.10 Notificaciones
create policy "Users read own notifications" on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users mark own notifications read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 15.11 Reportes (los visitantes los envían por el servidor; admin los gestiona)
create policy "Admins manage reports" on public.reports
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

-- 15.12 Ajustes y auditoría
create policy "Admins manage settings" on public.app_settings
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

create policy "Admins read audit logs" on public.audit_logs
  for select to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------
-- 16. PERMISOS (GRANT): cerrado por defecto, abrir solo lo necesario
-- ---------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- Lo que se cree en el futuro tampoco queda abierto por defecto.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant usage on schema private to anon, authenticated, service_role;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.owns_professional(uuid) to anon, authenticated;
grant execute on function private.can_view_professional(uuid) to anon, authenticated;
-- La vista professionals_public llama a esta función: PostgreSQL comprueba el
-- permiso con el usuario que consulta, no con el dueño de la vista.
grant execute on function private.contacts_enabled(uuid) to anon, authenticated;

-- Lectura pública (las políticas RLS filtran las filas)
grant select on public.states, public.municipalities, public.localities,
  public.categories, public.services, public.plans,
  public.professional_categories, public.professional_services,
  public.professional_photos
  to anon, authenticated;

grant select on public.professionals_public, public.listing_combinations
  to anon, authenticated;

-- Gestión (las políticas RLS exigen admin o dueño)
grant insert, update, delete on public.states, public.municipalities,
  public.localities, public.categories, public.services, public.plans
  to authenticated;

grant insert, delete on public.professional_categories to authenticated;
grant insert, update, delete on public.professional_services,
  public.professional_photos to authenticated;

grant select, insert, update on public.professional_contacts to authenticated;

-- Usuarios: solo pueden cambiar su nombre (no rol, no email).
grant select on public.user_profiles to authenticated;
grant update (full_name) on public.user_profiles to authenticated;

-- Profesionales: sin permiso sobre status, approved_*, owner_id al actualizar.
grant select on public.professionals to authenticated;
grant insert (owner_id, business_name, slug, description, logo_path,
  locality_id, service_areas, experience_years, working_hours, availability)
  on public.professionals to authenticated;
grant update (business_name, slug, description, logo_path, locality_id,
  service_areas, experience_years, working_hours, availability)
  on public.professionals to authenticated;

-- Solo lectura desde la API
grant select on public.subscriptions, public.payments, public.payment_receipts,
  public.profile_events, public.audit_logs to authenticated;

grant select, insert, update, delete on public.featured_listings to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant select on public.reports to authenticated;
grant update (status, resolved_by, resolved_at) on public.reports to authenticated;
grant select on public.app_settings to authenticated;
grant update (value) on public.app_settings to authenticated;

-- Función administrativa (verifica is_admin() internamente)
grant execute on function public.admin_set_professional_status(
  uuid, public.professional_status, text) to authenticated;

-- ---------------------------------------------------------------------
-- 17. STORAGE: buckets y políticas
-- ---------------------------------------------------------------------
-- Estructura de rutas: {professional_id}/{archivo}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('professional-media', 'professional-media', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-receipts', 'payment-receipts', false, 5242880,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- Fotos y logos: lectura pública por URL; escritura solo dueño/admin.
create policy "Owners read own media" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'professional-media'
    and (private.owns_professional(private.storage_professional_id(name))
         or private.is_admin())
  );
create policy "Owners upload media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'professional-media'
    and (private.owns_professional(private.storage_professional_id(name))
         or private.is_admin())
  );
create policy "Owners update media" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'professional-media'
    and (private.owns_professional(private.storage_professional_id(name))
         or private.is_admin())
  );
create policy "Owners delete media" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'professional-media'
    and (private.owns_professional(private.storage_professional_id(name))
         or private.is_admin())
  );

-- Comprobantes: bucket privado; dueño sube y lee; admin lee. Sin borrar ni editar.
create policy "Owners and admins read receipts" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'payment-receipts'
    and (private.owns_professional(private.storage_professional_id(name))
         or private.is_admin())
  );
create policy "Owners upload receipts" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'payment-receipts'
    and private.owns_professional(private.storage_professional_id(name))
  );
