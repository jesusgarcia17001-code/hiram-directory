-- =====================================================================
-- HIRAM DIRECTORY - DATOS DE REFERENCIA (no son datos ficticios)
-- Ejecutar DESPUÉS de 20261118120000_initial_schema.sql
-- Todo esto es editable luego desde el panel de administración.
-- =====================================================================

-- Estado, municipios y localidades.
-- Etapa 1 activa: Puerto La Cruz y Barcelona.
-- Etapas 2 y 3 quedan desactivadas hasta que se abra cobertura.
insert into public.states (name, slug)
values ('Anzoátegui', 'anzoategui');

insert into public.municipalities (state_id, name, slug, is_active)
select s.id, v.name, v.slug, v.is_active
from public.states s
cross join (values
  ('Sotillo',                  'sotillo',                  true),
  ('Simón Bolívar',            'simon-bolivar',            true),
  ('Diego Bautista Urbaneja',  'diego-bautista-urbaneja',  false),
  ('Guanta',                   'guanta',                   false),
  ('Píritu',                   'piritu',                   false)
) as v(name, slug, is_active)
where s.slug = 'anzoategui';

insert into public.localities (municipality_id, name, slug, is_active)
select m.id, v.name, v.slug, v.is_active
from public.municipalities m
join (values
  ('sotillo',                 'Puerto La Cruz', 'puerto-la-cruz', true),
  ('simon-bolivar',           'Barcelona',      'barcelona',      true),
  ('diego-bautista-urbaneja', 'Lechería',       'lecheria',       false),
  ('guanta',                  'Guanta',         'guanta',         false),
  ('piritu',                  'Píritu',         'piritu',         false)
) as v(municipality_slug, name, slug, is_active)
  on v.municipality_slug = m.slug;

-- Categorías iniciales (con datos para las páginas de lista SEO).
insert into public.categories
  (name, slug, listing_slug, singular_label, plural_label, description, icon, sort_order)
values
  ('Aire acondicionado', 'aire-acondicionado', 'tecnicos-aire-acondicionado',
   'Técnico de aire acondicionado', 'Técnicos de aire acondicionado',
   'Instalación, reparación y mantenimiento de aire acondicionado.', 'wind', 1),
  ('Electricidad', 'electricidad', 'electricistas',
   'Electricista', 'Electricistas',
   'Instalaciones y reparaciones eléctricas.', 'zap', 2),
  ('Plomería', 'plomeria', 'plomeros',
   'Plomero', 'Plomeros',
   'Tuberías, filtraciones y reparaciones de plomería.', 'wrench', 3),
  ('Reparaciones domésticas y línea blanca', 'reparaciones-domesticas',
   'tecnicos-linea-blanca',
   'Técnico de línea blanca', 'Técnicos de línea blanca',
   'Reparación de electrodomésticos y arreglos del hogar.', 'house', 4);

-- Planes (precios y beneficios son hipótesis a validar; editables en admin).
insert into public.plans
  (name, slug, description, price, currency, duration_days, features, sort_order)
values
  ('Gratuito', 'gratuito',
   'Perfil básico. Hasta 10 visitas únicas o 5 contactos únicos.',
   0, 'USD', 30,
   '{"contact_buttons":"limited","statistics":"basic","max_photos":0,"featured":false}'::jsonb,
   0),
  ('Profesional', 'profesional',
   'Perfil completo, fotografías, contactos y estadísticas.',
   5, 'USD', 30,
   '{"contact_buttons":"unlimited","statistics":"full","max_photos":6,"featured":false}'::jsonb,
   1),
  ('Premium', 'premium',
   'Todo lo del plan Profesional con mayor visibilidad y posicionamiento destacado.',
   10, 'USD', 30,
   '{"contact_buttons":"unlimited","statistics":"advanced","max_photos":15,"featured":true,"promotions":true}'::jsonb,
   2);

-- Límites del plan gratuito (acumulados, no se reinician).
insert into public.app_settings (key, value)
values
  ('free_visit_limit', '10'::jsonb),
  ('free_contact_limit', '5'::jsonb);
