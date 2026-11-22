-- =====================================================================
-- FASE: Perfiles Semilla Optimizados para SEO (25 perfiles / 5 categorías)
-- Cobertura: Puerto La Cruz, Barcelona y Lechería (Anzoátegui)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ACTIVACIÓN DE COBERTURA: LECHERÍA (Diego Bautista Urbaneja)
-- Permite que las listas SEO de Lechería también se activen al tener profesionales
-- ---------------------------------------------------------------------
update public.municipalities
set is_active = true
where slug = 'diego-bautista-urbaneja';

update public.localities
set is_active = true
where slug = 'lecheria';

-- ---------------------------------------------------------------------
-- 2. ASEGURAR CATEGORÍAS: Herrería y Albañilería
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, listing_slug, singular_label, plural_label, description, icon, sort_order)
values
  ('Herrería', 'herreria', 'herreros', 'Herrero', 'Herreros', 'Fabricación de rejas, portones, estructuras metálicas y soldadura en general.', 'shield', 5),
  ('Albañilería', 'albanileria', 'albaniles', 'Albañil', 'Albañiles', 'Construcción, remodelaciones, colocación de cerámica, porcelanato y friso.', 'hammer', 6)
on conflict (slug) do update set
  listing_slug = excluded.listing_slug,
  singular_label = excluded.singular_label,
  plural_label = excluded.plural_label,
  description = excluded.description;

-- ---------------------------------------------------------------------
-- 3. INSERCIÓN DE 25 PERFILES SEMILLA CON SERVICIOS Y CONTACTOS
-- ---------------------------------------------------------------------
do $$
declare
  v_plc_id uuid;
  v_bna_id uuid;
  v_lec_id uuid;

  v_cat_plomeria uuid;
  v_cat_herreria uuid;
  v_cat_albanileria uuid;
  v_cat_aire uuid;
  v_cat_electricidad uuid;

  v_user_id uuid;
  v_prof_id uuid;
begin
  -- Localidades
  select id into v_plc_id from public.localities where slug = 'puerto-la-cruz' limit 1;
  select id into v_bna_id from public.localities where slug = 'barcelona' limit 1;
  select id into v_lec_id from public.localities where slug = 'lecheria' limit 1;

  -- Categorías
  select id into v_cat_plomeria from public.categories where slug = 'plomeria' limit 1;
  select id into v_cat_herreria from public.categories where slug = 'herreria' limit 1;
  select id into v_cat_albanileria from public.categories where slug = 'albanileria' limit 1;
  select id into v_cat_aire from public.categories where slug = 'aire-acondicionado' limit 1;
  select id into v_cat_electricidad from public.categories where slug = 'electricidad' limit 1;

  -- ===================================================================
  -- CATEGORÍA 1: PLOMERÍA (5 PERFILES)
  -- ===================================================================

  -- 1.1 Plomería Residencial y Destapes (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'plomero-destapes-urgencias-puerto-la-cruz') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.plomeria1@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Plomería El Puerto"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Plomería y Destapes Express Puerto La Cruz',
      'plomero-destapes-urgencias-puerto-la-cruz',
      'individual',
      'Servicio de plomería y destape urgente de cañerías en Puerto La Cruz, Pozuelos y Guanta. Destapamos tuberías principales de aguas negras, fregaderos, sanitarios y bajantes con máquina de guaya eléctrica sin dañar cerámicas ni pisos. Reparamos botes de agua en baños, instalación de griferías y sustitución de flotantes mecánicos.',
      v_plc_id,
      array['Puerto La Cruz', 'Lechería', 'Guanta'],
      12,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148110001', '+584148110001');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_plomeria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Destape de cañerías con máquina', 'Destape mecánico de tuberías de aguas negras y sifones atascados.'),
      (v_prof_id, 'Reparación de filtraciones en baños', 'Sustitución de tubos rotos, herrajes de inodoro y sellado de juntas.'),
      (v_prof_id, 'Instalación de griferías y llaves de paso', 'Colocación de mezcladoras para lavamanos, duchas y llaves de paso.');
  end if;

  -- 1.2 Bombas de Agua e Hidroneumáticos (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'bombas-de-agua-e-hidroneumaticos-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.plomeria2@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"HidroServicios Barcelona"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Hidroneumáticos y Bombas Barcelona',
      'bombas-de-agua-e-hidroneumaticos-barcelona',
      'company',
      'Instalación, mantenimiento y reparación de sistemas hidroneumáticos y bombas de agua en Barcelona y Nueva Barcelona. Calibramos presostatos, reparamos pulmones con y sin membrana, sustitución de sellos mecánicos, cebado y mantenimiento de tableros de control para bombas monofásicas y trifásicas.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz', 'Lechería'],
      16,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248120002', '+584248120002');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_plomeria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Mantenimiento de sistemas hidroneumáticos', 'Revisión de pulmones, reemplazo de membrana y presurización.'),
      (v_prof_id, 'Reparación de bombas de agua', 'Cambio de sellos mecánicos, rodamientos, turbinas e impulsores.'),
      (v_prof_id, 'Montaje de tuberías de alta presión', 'Conexión de tubería de succión y descarga con válvulas check.');
  end if;

  -- 1.3 Detección de Filtraciones Ocultas y Termofusión (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'deteccion-filtraciones-plomeria-puerto-la-cruz') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.plomeria3@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Plomería TermoFix"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Detección de Filtraciones y Termofusión PLC',
      'deteccion-filtraciones-plomeria-puerto-la-cruz',
      'individual',
      'Técnico especialista en detección de filtraciones no visibles en paredes, techos y losas de piso. Realizamos pruebas de presión hidrostática para localizar fugas de agua blanca. Expertos en soldadura por termofusión (PPR), tubería PVC y cobre para agua fría y caliente en residencias de Puerto La Cruz y Lechería.',
      v_plc_id,
      array['Puerto La Cruz', 'Lechería', 'Barcelona'],
      10,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584128130003', '+584128130003');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_plomeria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Prueba de presión y detección de fugas', 'Localización precisa de fugas ocultas para evitar romper áreas innecesarias.'),
      (v_prof_id, 'Instalación de tuberías por termofusión', 'Tendido de tubería PPR sin riesgo de despegue ni goteos.'),
      (v_prof_id, 'Reparación de fugas en agua caliente', 'Sustitución de tubos galvanizados o cobre deteriorados.');
  end if;

  -- 1.4 Plomería Comercial y Trampas de Grasa (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'plomeria-comercial-trampas-grasa-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.plomeria4@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Plomería Comercial Oriente"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Plomería Comercial y Trampas de Grasa',
      'plomeria-comercial-trampas-grasa-barcelona',
      'company',
      'Servicios integrales de plomería para restaurantes, panaderías, clínicas y centros comerciales en Barcelona y zona norte de Anzoátegui. Instalación, mantenimiento y limpieza técnica de trampas de grasa en acero inoxidable. Desobstrucción de ramales de cocina, tanquillas y mantenimiento preventivo de líneas cloacales.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz', 'Lechería'],
      18,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148140004', '+584148140004');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_plomeria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Mantenimiento de trampas de grasa', 'Limpieza profunda y extracción de sedimentos en cocinas comerciales.'),
      (v_prof_id, 'Desobstrucción de tanquillas y ramales', 'Destape de alcantarillas y tuberías de gran diámetro.'),
      (v_prof_id, 'Instalación de redes sanitarias comerciales', 'Planos y tendido de tuberías bajo normativa sanitaria.');
  end if;

  -- 1.5 Mantenimiento de Tanques y Redes Hidráulicas (Lechería)
  if not exists (select 1 from public.professionals where slug = 'mantenimiento-tanques-plomeria-lecheria') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.plomeria5@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"AquaTanques Lechería"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Mantenimiento de Tanques y Redes Lechería',
      'mantenimiento-tanques-plomeria-lecheria',
      'individual',
      'Limpieza, lavado a presión y desinfección química de tanques de agua subterráneos y aéreos en Lechería y El Morro. Corrección de fugas en flotantes mecánicos y eléctricos, reemplazo de válvulas de retención (check) y optimización de redes de distribución de agua potable para villas y condominios.',
      v_lec_id,
      array['Lechería', 'Puerto La Cruz', 'Barcelona'],
      14,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248150005', '+584248150005');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_plomeria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Lavado y desinfección de tanques de agua', 'Limpieza profunda con retiro de lodos y desinfección con cloro.'),
      (v_prof_id, 'Instalación de flotantes mecánicos y eléctricos', 'Sustitución de boyas y sistemas automáticos de llenado.'),
      (v_prof_id, 'Mantenimiento de filtros de entrada y sedimentos', 'Reemplazo de cartuchos y filtros desbarradores.');
  end if;


  -- ===================================================================
  -- CATEGORÍA 2: HERRERÍA (5 PERFILES)
  -- ===================================================================

  -- 2.1 Herrería Residencial y Rejas de Seguridad (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'herreria-residencial-rejas-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.herreria1@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Herrería San Cristóbal"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Herrería Residencial y Rejas Barcelona',
      'herreria-residencial-rejas-barcelona',
      'individual',
      'Fabricación e instalación de rejas de seguridad para puertas y ventanas en Barcelona, Boyacá y Tronconal. Diseños modernos y tradicionales con tubos estructurales y cabillas cuadradas. Protectores para compresores de aire acondicionado, puertas principales con cerradura multilock y marcos metálicos reforzados.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz', 'Lechería'],
      15,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148210001', '+584148210001');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_herreria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Fabricación de rejas de seguridad', 'Rejas para ventanas y puertas en perfiles de hierro macizo o tubular.'),
      (v_prof_id, 'Jaulas protectoras para aire split', 'Protectores soldados antirrobo con candados cubiertos.'),
      (v_prof_id, 'Puertas de hierro con cerradura de seguridad', 'Puertas residenciales con acabados anticorrosivos de alta duración.');
  end if;

  -- 2.2 Portones Eléctricos y Automatización (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'portones-electricos-herreria-puerto-la-cruz') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.herreria2@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Portones Automáticos PLC"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Portones Eléctricos y Automatizaciones PLC',
      'portones-electricos-herreria-puerto-la-cruz',
      'company',
      'Fabricación, reparación y mantenimiento de portones eléctricos en Puerto La Cruz y Lechería. Especialistas en portones corredizos, batientes de dos hojas y levadizos. Montaje de motores (CAME, BFT, Nova), piñones, cremalleras de acero, sensores infrarrojos y programación de controles remotos.',
      v_plc_id,
      array['Puerto La Cruz', 'Lechería', 'Guanta', 'Barcelona'],
      13,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248220002', '+584248220002');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_herreria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Instalación de motores para portones', 'Montaje y calibración de motores corredizos y brazos hidráulicos.'),
      (v_prof_id, 'Mantenimiento preventivo de portón', 'Engrase de rodamientos, ajuste de cremallera y alineación de guías.'),
      (v_prof_id, 'Programación de controles remotos', 'Configuración de controles de seguridad de alta frecuencia.');
  end if;

  -- 2.3 Techos Metálicos y Estructuras (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'techos-estructuras-metalicas-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.herreria3@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Estructuras Metálicas BNA"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Techos y Estructuras Metálicas Barcelona',
      'techos-estructuras-metalicas-barcelona',
      'company',
      'Montaje de techos de acerolit, machihembrado sobre vigas de hierro, termotechos y policarbonato para estacionamientos y patios en Barcelona. Diseño de escaleras caracol y rectas con perfiles tubulares, barandas para terrazas y pérgolas decorativas en hierro forjado o estructural.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz', 'Lechería'],
      17,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584128230003', '+584128230003');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_herreria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Instalación de techos de acerolit', 'Estructuras de soporte en tubo de hierro con anclajes resistentes.'),
      (v_prof_id, 'Fabricación de escaleras de hierro', 'Escaleras rectas o de caracol con peldaños en lámina estriada.'),
      (v_prof_id, 'Barandas y pasamanos metálicos', 'Protección para balcones y pasillos en casas y edificios.');
  end if;

  -- 2.4 Herrería Industrial y Soldadura Pesada (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'soldadura-herreria-industrial-puerto-la-cruz') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.herreria4@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Metalmecánica Oriente"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Herrería Industrial y Soldadura Pesada PLC',
      'soldadura-herreria-industrial-puerto-la-cruz',
      'company',
      'Taller metalmecánico especializado en soldadura con electrodo revestido y microalambre (MIG/MAG). Construcción de galpones, mezzaninas comerciales, barandales náuticos en acero inoxidable y refuerzo de chasis. Trabajos industriales bajo normas de resistencia y seguridad en Puerto La Cruz y Guanta.',
      v_plc_id,
      array['Puerto La Cruz', 'Barcelona', 'Guanta'],
      20,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148240004', '+584148240004');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_herreria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Construcción de mezzaninas metálicas', 'Pisos intermedios con vigas IPN y láminas losacero para depósitos.'),
      (v_prof_id, 'Soldadura en acero al carbono e inoxidable', 'Procesos de soldadura certificados para alta resistencia.'),
      (v_prof_id, 'Refuerzo de marcos y estructuras pesadas', 'Enderezado y refuerzo de pórticos y columnas metálicas.');
  end if;

  -- 2.5 Reparaciones de Herrería y Soldadura a Domicilio (Lechería)
  if not exists (select 1 from public.professionals where slug = 'reparaciones-herreria-domicilio-lecheria') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.herreria5@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Herrero Express Lechería"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Herrería Rápida y Soldadura a Domicilio',
      'reparaciones-herreria-domicilio-lecheria',
      'individual',
      'Servicio de herrería portátil para reparaciones inmediatas en Lechería y Puerto La Cruz. Solucionamos bisagras caídas de portones, soldadura de cerrojos, cambio de ruedas para rejas corredizas, arreglo de pestillos y aplicación de pintura anticorrosiva de fondo y acabado para proteger el hierro contra el salitre.',
      v_lec_id,
      array['Lechería', 'Puerto La Cruz', 'Barcelona'],
      11,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248250005', '+584248250005');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_herreria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Reparación de bisagras y cerraduras', 'Soldadura in situ para portones caídos y rejas desalineadas.'),
      (v_prof_id, 'Cambio de rodamientos de portón', 'Reemplazo de garruchas desgastadas por ruedas de acero selladas.'),
      (v_prof_id, 'Protección anticorrosiva marina', 'Lijado, fondo de cromato de zinc y esmalte de alta resistencia al mar.');
  end if;


  -- ===================================================================
  -- CATEGORÍA 3: ALBAÑILERÍA (5 PERFILES)
  -- ===================================================================

  -- 3.1 Maestro de Obras y Remodelaciones (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'maestro-albanil-remodelaciones-puerto-la-cruz') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.albanileria1@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Construcciones PLC"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Maestro Albañil y Remodelaciones PLC',
      'maestro-albanil-remodelaciones-puerto-la-cruz',
      'individual',
      'Albañil maestro de obras con más de 20 años de experiencia en Puerto La Cruz. Levantamiento de paredes de bloques de cemento y arcilla, friso rústico, friso sobado y friso liso pulido para pintar. Apertura de vanos para ventanas y puertas, remodelación de baños, cocinas y ampliaciones de viviendas familiares.',
      v_plc_id,
      array['Puerto La Cruz', 'Barcelona', 'Lechería'],
      22,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148310001', '+584148310001');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_albanileria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Pegado de bloques y friso pulido', 'Levantamiento de paredes aplomadas y frisos de primera calidad.'),
      (v_prof_id, 'Remodelación integral de baños', 'Demolición, sobrepiso, impermeabilización de ducha y alicatado.'),
      (v_prof_id, 'Construcción de mesones en concreto', 'Mesones de cocina y lavandero con refuerzo de cabilla.');
  end if;

  -- 3.2 Instalación de Porcelanato y Cerámica (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'instalador-porcelanato-ceramica-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.albanileria2@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Pisos & Cerámicas BNA"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Instalador de Porcelanato y Cerámicas Barcelona',
      'instalador-porcelanato-ceramica-barcelona',
      'individual',
      'Colocador profesional de pisos de porcelanato gran formato (60x60, 60x120), baldosas cerámicas y fachaletas en Barcelona y Nueva Barcelona. Nivelación milimétrica de pisos con pega blanca especial, crucetas niveladoras, cortes a inglete en 45 grados y emboquillado impermeable antimoho.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz', 'Lechería'],
      14,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248320002', '+584248320002');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_albanileria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Instalación de porcelanato rectificado', 'Colocación nivelada con cuñas y pega de alta adherencia.'),
      (v_prof_id, 'Revestimiento de paredes y salpicaderos', 'Cerámicas decorativas para cocinas y baños.'),
      (v_prof_id, 'Cortes de precisión en 45 grados', 'Acabados limpios sin perfiles plásticos en esquinas exteriores.');
  end if;

  -- 3.3 Instalador de Drywall y Techos de Escayola (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'drywall-cielo-raso-puerto-la-cruz') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.albanileria3@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Drywall del Este"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Drywall, Cielos Rasos y Yeso Puerto La Cruz',
      'drywall-cielo-raso-puerto-la-cruz',
      'company',
      'Soluciones en construcción liviana y tabiquería de yeso (Drywall) en Puerto La Cruz y Lechería. Fabricamos paredes divisorias acústicas, techos decorativos con luz indirecta, cielos rasos en láminas de escayola o anime decorativo, molduras y repisas flotantes empotradas para salas y oficinas.',
      v_plc_id,
      array['Puerto La Cruz', 'Lechería', 'Barcelona'],
      11,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584128330003', '+584128330003');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_albanileria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Tabiquería divisoria de Drywall', 'Paredes internas con perfiles galvanizados y aislamiento.'),
      (v_prof_id, 'Techos decorativos con fajas de luz', 'Cielos de yeso con cajones para tiras LED y spots empotrados.'),
      (v_prof_id, 'Enpaste y lijado sin imperfecciones', 'Acabado liso listo para recibir pintura de caucho o satinada.');
  end if;

  -- 3.4 Impermeabilización de Platabandas y Techos (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'impermeabilizacion-platabandas-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.albanileria4@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Impermeabilizaciones Oriente"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Impermeabilización de Platabandas Barcelona',
      'impermeabilizacion-platabandas-barcelona',
      'company',
      'Especialistas en erradicación de filtraciones y goteras en techos de concreto en Barcelona y Puerto La Cruz. Aplicación de manto asfáltico caliente con soplete, pintura de aluminio reflectiva, mantos autoadhesivos y membranas líquidas elastoméricas de alta durabilidad para resistir el sol y la lluvia.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz', 'Lechería'],
      19,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148340004', '+584148340004');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_albanileria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Instalación de manto asfáltico', 'Sellado hermético de losas con soplete y primario asfáltico.'),
      (v_prof_id, 'Reparación de grietas y medias cañas', 'Construcción de pendientes para drenaje hacia bajantes de agua.'),
      (v_prof_id, 'Pintura térmica reflectiva', 'Pintura de aluminio para proteger el manto y reducir el calor.');
  end if;

  -- 3.5 Concreto Armado y Caminerías (Lechería)
  if not exists (select 1 from public.professionals where slug = 'construccion-concreto-albanileria-lecheria') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.albanileria5@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Obras Civiles Lechería"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Construcción en Concreto y Caminerías Lechería',
      'construccion-concreto-albanileria-lecheria',
      'individual',
      'Vaciado de pisos de concreto estampado, sobrepisos autonivelantes, aceras y caminerías para casas y urbanismos en Lechería. Construcción de vigas de corona, columnas reforzadas con cabilla de 3/8 y 1/2 pulgada, zapatas y muros de contención con dosificación exacta de arena y piedra picada.',
      v_lec_id,
      array['Lechería', 'Puerto La Cruz', 'Barcelona'],
      16,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248350005', '+584248350005');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_albanileria);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Vaciado de pisos y aceras de concreto', 'Pisos lisos o rayados con juntas de dilatación para evitar quiebres.'),
      (v_prof_id, 'Encofrado y armado de columnas', 'Armado de estribos y vaciado de concreto estructural.'),
      (v_prof_id, 'Reparación de fachadas agrietadas', 'Picado y saneamiento de revoques soplados por la humedad.');
  end if;


  -- ===================================================================
  -- CATEGORÍA 4: AIRE ACONDICIONADO (5 PERFILES)
  -- ===================================================================

  -- 4.1 Mantenimiento Preventivo y Lavado de Splits (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'mantenimiento-split-lavado-puerto-la-cruz') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.aire1@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"ClimaFácil PLC"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Mantenimiento y Lavado de Splits Puerto La Cruz',
      'mantenimiento-split-lavado-puerto-la-cruz',
      'individual',
      'Mantenimiento profundo de aires acondicionados split y de ventana en Puerto La Cruz y Lechería. Lavado técnico de serpentín y turbina con hidrolavadora a presión, productos desengrasantes y desinfectantes bactericidas. Destape de mangueras de drenaje, chequeo de presiones y medición de consumo eléctrico (amperaje).',
      v_plc_id,
      array['Puerto La Cruz', 'Lechería', 'Guanta'],
      9,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148410001', '+584148410001');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_aire);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Lavado de consola con hidrolavadora', 'Limpieza sin desmontar con funda protectora para no mojar paredes.'),
      (v_prof_id, 'Limpieza de unidad condensadora exterior', 'Retiro de suciedad y sarro para mejorar la disipación de calor.'),
      (v_prof_id, 'Destape de desagüe y eliminación de malos olores', 'Limpieza de bandeja para evitar goteos dentro de la habitación.');
  end if;

  -- 4.2 Detección de Fugas y Recarga de Gas R410A / R22 (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'recarga-gas-reparacion-split-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.aire2@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Refrigas Barcelona"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Recarga de Gas y Reparación de Splits Barcelona',
      'recarga-gas-reparacion-split-barcelona',
      'individual',
      'Diagnóstico y reparación de fugas de gas refrigerante en aires acondicionados en Barcelona. Presurización con nitrógeno seco para ubicar microporos, soldadura en tubería de cobre y aluminio con varilla de plata, vacío profesional con bomba de vacío de doble etapa y recarga por peso con refrigerante R410A, R22 y R32.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz', 'Lechería'],
      13,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248420002', '+584248420002');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_aire);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Recarga de gas R410A con manómetro digital', 'Carga exacta según especificaciones del fabricante.'),
      (v_prof_id, 'Soldadura de fugas en tuberías de cobre', 'Corrección de roturas en tuercas flare y soldaduras fatigadas.'),
      (v_prof_id, 'Reemplazo de capacitores y contactores', 'Sustitución de capacitores dañados que impiden el arranque del compresor.');
  end if;

  -- 4.3 Instalación de Aires Split e Inverter (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'instalacion-aires-split-inverter-plc') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.aire3@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Instalaciones Inverter PLC"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Instalación de Aires Split e Inverter PLC',
      'instalacion-aires-split-inverter-plc',
      'company',
      'Instalaciones autorizadas de aires acondicionados convencionales e Inverter (12.000 a 24.000 BTU) en Puerto La Cruz y Lechería. Cumplimos con la longitud mínima de tubería de cobre, abocardado cónico sin escapes, vacío profundo para retirar humedad del circuito y fijación de soportes exteriores con taquetes de expansión.',
      v_plc_id,
      array['Puerto La Cruz', 'Lechería', 'Barcelona'],
      12,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584128430003', '+584128430003');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_aire);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Instalación de aire split nuevo o usado', 'Montaje completo con tubería de cobre, cable interconexión y aislante térmico.'),
      (v_prof_id, 'Montaje de bases para compresor', 'Fijación segura en paredes altas o techos con soportes pintados.'),
      (v_prof_id, 'Desinstalación y recuperación de gas', 'Recogida del gas en la unidad exterior para mudanzas.');
  end if;

  -- 4.4 Aires Centrales y Equipos Comerciales (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'aires-centrales-climatizacion-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.aire4@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Climatización Central Oriente"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Aires Centrales y Climatización Barcelona',
      'aires-centrales-climatizacion-barcelona',
      'company',
      'Mantenimiento y reparación de unidades compactas de 3 a 15 toneladas, sistemas Fan Coil y ductos de ventilación en Barcelona. Atendemos farmacias, comercios, bancos y clínicas. Cambio de motores sopladores (blower), correas trapezoidales, termostatos digitales y revisión de presiones en compresores scroll.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz', 'Lechería'],
      21,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148440004', '+584148440004');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_aire);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Mantenimiento de unidad central compacta', 'Limpieza química de serpentines condensadores y evaporadores.'),
      (v_prof_id, 'Instalación de termostatos programables', 'Sustitución de termostatos mecánicos por digitales inteligentes.'),
      (v_prof_id, 'Limpieza y desinfección de ductos de aire', 'Eliminación de polvo y hongos en difusores y ductería.');
  end if;

  -- 4.5 Refrigeración Comercial y Cavas Cuarto (Lechería)
  if not exists (select 1 from public.professionals where slug = 'refrigeracion-comercial-aires-lecheria') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.aire5@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Refrigeración Total Lechería"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Refrigeración Comercial y Cavas Lechería',
      'refrigeracion-comercial-aires-lecheria',
      'company',
      'Servicio técnico especializado en cavas cuarto de conservación y congelación, neveras exhibidoras y aires piso-techo en Lechería. Reemplazo de válvulas de expansión termostáticas, relays de arranque, descarche por resistencias y control de temperatura electrónico Carel o Dixell para restaurantes y bodegones.',
      v_lec_id,
      array['Lechería', 'Puerto La Cruz', 'Barcelona'],
      15,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248450005', '+584248450005');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_aire);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Reparación de cavas cuarto y congeladores', 'Solución de problemas de frío y congelamiento en bodegones.'),
      (v_prof_id, 'Instalación de controladores de temperatura', 'Montaje de termostatos digitales con alarmas de descongelamiento.'),
      (v_prof_id, 'Mantenimiento de aires piso-techo', 'Limpieza y chequeo de turbinas en equipos de gran capacidad.');
  end if;


  -- ===================================================================
  -- CATEGORÍA 5: ELECTRICIDAD (5 PERFILES)
  -- ===================================================================

  -- 5.1 Electricista Residencial de Hogar (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'electricista-residencial-hogar-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.electricidad1@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"ElectroHogar Barcelona"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Electricista Residencial de Hogar Barcelona',
      'electricista-residencial-hogar-barcelona',
      'individual',
      'Electricista certificado para el hogar en Barcelona. Solucionamos apagones imprevistos, cortocircuitos en tomas y cables recalentados. Instalamos cableado nuevo 110V y 220V, tomas corrientes polarizados, apagadores, timbres, lámparas decorativas de techo y ventiladores en casas y apartamentos.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz', 'Lechería'],
      10,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148510001', '+584148510001');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_electricidad);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Detección y corrección de cortocircuitos', 'Revisión con tester y pinza amperimétrica para ubicar fallas.'),
      (v_prof_id, 'Instalación de tomacorrientes e interruptores', 'Reemplazo de tomas quemados por accesorios de calidad.'),
      (v_prof_id, 'Cableado para líneas de 220V', 'Instalación de circuitos independientes para cocinas eléctricas y secadoras.');
  end if;

  -- 5.2 Protectores de Voltaje Integrales y Tableros (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'protectores-voltaje-tableros-puerto-la-cruz') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.electricidad2@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tableros Eléctricos PLC"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Protectores de Voltaje y Tableros Eléctricos PLC',
      'protectores-voltaje-tableros-puerto-la-cruz',
      'individual',
      'Protección eléctrica integral para electrodomésticos y aires acondicionados en Puerto La Cruz y Lechería. Montamos protectores generales de voltaje (Superfren, Exceline) con contactores de potencia para cuidar toda tu casa contra sobretensiones y apagones. Reorganización de tableros y reemplazo de breakers flojos.',
      v_plc_id,
      array['Puerto La Cruz', 'Lechería', 'Barcelona'],
      14,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248520002', '+584248520002');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_electricidad);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Instalación de protector de voltaje integral', 'Protección para toda la casa o negocio con contactor magnético.'),
      (v_prof_id, 'Reorganización y balanceo de tableros', 'Etiquetado de circuitos y sustitución de breakers desgastados.'),
      (v_prof_id, 'Sustitución de breaker principal', 'Montaje de breakers termomagnéticos de 50A, 70A o 100A.');
  end if;

  -- 5.3 Electricidad Industrial y Redes Trifásicas (Barcelona)
  if not exists (select 1 from public.professionals where slug = 'electricidad-industrial-trifasica-barcelona') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.electricidad3@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"ElectroIndustrial Anzoátegui"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Electricidad Industrial y Redes Trifásicas BNA',
      'electricidad-industrial-trifasica-barcelona',
      'company',
      'Ingeniería y mantenimiento eléctrico para panaderías, carnicerías, talleres y galpones en la Zona Industrial de Barcelona y Los Montones. Cableado de fuerza 208V/220V/440V trifásico, arrancadores estrella-triángulo, contactores, relés de sobrecarga térmica y balanceo de fases para reducir pérdidas.',
      v_bna_id,
      array['Barcelona', 'Puerto La Cruz'],
      18,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584128530003', '+584128530003');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_electricidad);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Montaje de tableros de fuerza trifásicos', 'Tableros de distribución para maquinaria pesada y motores.'),
      (v_prof_id, 'Instalación de arrancadores de motor', 'Protección contra falta de fase y sobrecarga en compresores y molinos.'),
      (v_prof_id, 'Medición y corrección del factor de potencia', 'Instalación de bancos de condensadores.');
  end if;

  -- 5.4 Conexión de Plantas Eléctricas y Transfer ATS (Puerto La Cruz)
  if not exists (select 1 from public.professionals where slug = 'plantas-electricas-transfer-puerto-la-cruz') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.electricidad4@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Energía de Respaldo PLC"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Plantas Eléctricas y Transfer Automático PLC',
      'plantas-electricas-transfer-puerto-la-cruz',
      'company',
      'Instalación técnica de generadores eléctricos residenciales y comerciales a gasolina, diésel o gas en Puerto La Cruz y Lechería. Montaje de conmutadores manuales (breakers de interbloqueo) y tableros de transferencia automática (ATS) para que la planta encienda al irse la luz sin retorno peligroso a la red.',
      v_plc_id,
      array['Puerto La Cruz', 'Lechería', 'Barcelona'],
      13,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584148540004', '+584148540004');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_electricidad);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Instalación de transfer manual de seguridad', 'Conmutador con enclavamiento para evitar choques de corriente.'),
      (v_prof_id, 'Conexión de tableros de transferencia ATS', 'Automatización de arranque y parada de generadores.'),
      (v_prof_id, 'Mantenimiento del sistema eléctrico de la planta', 'Revisión de batería, alternador y cargador automático.');
  end if;

  -- 5.5 Iluminación LED, Acometidas y Puesta a Tierra (Lechería)
  if not exists (select 1 from public.professionals where slug = 'iluminacion-led-acometidas-lecheria') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
    values (v_user_id, '00000000-0000-0000-0000-000000000000', 'seed.electricidad5@ofirservicios.internal', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Iluminación & Proyectos Lechería"}', now(), now(), 'authenticated', 'authenticated');

    insert into public.professionals (owner_id, business_name, slug, provider_type, description, locality_id, service_areas, experience_years, availability, status, approved_at)
    values (
      v_user_id,
      'Iluminación LED, Acometidas y Puesta a Tierra',
      'iluminacion-led-acometidas-lecheria',
      'individual',
      'Instalación de proyectos de iluminación LED arquitectónica en jardines, piscinas, fachadas y áreas comunes en Lechería. Instalación de sensores de movimiento, fotoceldas automáticas, reflectores solares y renovación de acometidas eléctricas con varilla de cobre (Copperweld) para descarga segura a tierra.',
      v_lec_id,
      array['Lechería', 'Puerto La Cruz', 'Barcelona'],
      11,
      'available',
      'approved',
      now()
    ) returning id into v_prof_id;

    insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
    values (v_prof_id, '+584248550005', '+584248550005');

    insert into public.professional_categories (professional_id, category_id) values (v_prof_id, v_cat_electricidad);

    insert into public.professional_services (professional_id, name, description) values
      (v_prof_id, 'Instalación de iluminación LED y reflectores', 'Montaje de luminarias de bajo consumo para jardines y fachadas.'),
      (v_prof_id, 'Instalación de varilla de puesta a tierra', 'Montaje de electrodo de cobre con conector mecánico y medición.'),
      (v_prof_id, 'Automatización con fotoceldas y sensores', 'Encendido automático de luces al caer la noche o detectar paso.');
  end if;

end $$;
