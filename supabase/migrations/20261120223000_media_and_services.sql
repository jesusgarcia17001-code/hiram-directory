-- =====================================================================
-- FASE 7, PASO 3: Fotos y Servicios del Perfil
-- =====================================================================

-- 1. Actualizar el límite de fotos (max_photos) en los planes existentes.
-- Gratuito: 3 fotos, Profesional: 6 fotos, Premium: 15 fotos.
update public.plans
set features = jsonb_set(features, '{max_photos}', '3'::jsonb)
where slug = 'gratuito';

update public.plans
set features = jsonb_set(features, '{max_photos}', '6'::jsonb)
where slug = 'profesional';

update public.plans
set features = jsonb_set(features, '{max_photos}', '15'::jsonb)
where slug = 'premium';

-- 2. Asegurar política de lectura pública para el bucket 'professional-media'
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read professional media'
  ) then
    create policy "Public read professional media" on storage.objects
      for select to public
      using (bucket_id = 'professional-media');
  end if;
end $$;

-- 3. Catálogo inicial de servicios sugeridos por categoría
insert into public.services (category_id, name, slug)
select c.id, s.name, s.slug
from public.categories c
cross join (values
  -- Aire acondicionado
  ('aire-acondicionado', 'Mantenimiento preventivo de aire split y ventana', 'mantenimiento-preventivo'),
  ('aire-acondicionado', 'Instalación de consolas split y multisplit', 'instalacion-split'),
  ('aire-acondicionado', 'Recarga de gas refrigerante (R22, R410a)', 'recarga-gas'),
  ('aire-acondicionado', 'Reparación de tarjetas electrónicas y compresores', 'reparacion-compresor'),
  ('aire-acondicionado', 'Limpieza profunda de serpentín y turbina', 'limpieza-profunda'),
  ('aire-acondicionado', 'Corrección de botes de agua y drenajes', 'correccion-drenajes'),

  -- Electricidad
  ('electricidad', 'Instalación y cableado eléctrico residencial', 'instalacion-cableado'),
  ('electricidad', 'Armado y mantenimiento de tableros eléctricos', 'tableros-electricos'),
  ('electricidad', 'Instalación de protectores de voltaje y breakers', 'protectores-voltaje'),
  ('electricidad', 'Detección y corrección de cortocircuitos', 'deteccion-cortos'),
  ('electricidad', 'Iluminación LED y lámparas residenciales/comerciales', 'iluminacion-led'),
  ('electricidad', 'Instalación de plantas eléctricas y transferencias', 'plantas-electricas'),

  -- Plomería
  ('plomeria', 'Destape de cañerías y tuberías de aguas negras', 'destape-canerias'),
  ('plomeria', 'Reparación de fugas de agua y filtraciones', 'reparacion-fugas'),
  ('plomeria', 'Instalación y mantenimiento de bombas de agua e hidroneumáticos', 'bombas-agua'),
  ('plomeria', 'Instalación y cambio de griferías y sanitarios', 'griferias-sanitarios'),
  ('plomeria', 'Mantenimiento e instalación de calentadores de agua', 'calentadores-agua'),
  ('plomeria', 'Instalación de tanques de agua y flotantes', 'tanques-agua'),

  -- Reparaciones domésticas y línea blanca
  ('reparaciones-domesticas', 'Reparación de lavadoras automáticas y semiautomáticas', 'reparacion-lavadoras'),
  ('reparaciones-domesticas', 'Mantenimiento y reparación de neveras y refrigeradores', 'reparacion-neveras'),
  ('reparaciones-domesticas', 'Reparación de secadoras de ropa a gas y eléctricas', 'reparacion-secadoras'),
  ('reparaciones-domesticas', 'Mantenimiento de microondas y hornos eléctricos', 'reparacion-microondas'),
  ('reparaciones-domesticas', 'Reparación de cocinas a gas y vitrocerámicas', 'reparacion-cocinas'),
  ('reparaciones-domesticas', 'Servicio técnico de congeladores y cavas', 'reparacion-congeladores')
) as s(cat_slug, name, slug)
where c.listing_slug = s.cat_slug
on conflict (category_id, slug) do nothing;
