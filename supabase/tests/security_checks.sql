-- =====================================================================
-- PRUEBAS DE SEGURIDAD (Fase 0) - ejecutar DESPUÉS de las 2 migraciones.
-- Si algo falla, se detiene con un mensaje "FALLO: ...".
-- Si todo sale bien, termina con "TODAS LAS PRUEBAS PASARON".
-- Crea datos de prueba dentro de una transacción y al final hace ROLLBACK,
-- así que no deja nada guardado.
-- =====================================================================
rollback; -- Limpia cualquier transacción anterior que haya quedado abierta o abortada
begin;

-- Tabla de IDs de prueba (en public, visible para todos los roles durante la transacción)
create table if not exists public._test_ids (name text primary key, id uuid);
truncate table public._test_ids;
grant all on table public._test_ids to anon, authenticated;

-- Funciones auxiliares de prueba (con permisos para todos los roles)
create or replace function public._test_expect_error(p_sql text, p_label text) returns void
language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FALLO: se esperaba un error y no ocurrió: %', p_label;
exception when others then
  if sqlerrm like 'FALLO:%' then raise; end if;
end $$;
grant execute on function public._test_expect_error(text, text) to anon, authenticated;

create or replace function public._test_expect_count(p_sql text, p_expected int, p_label text) returns void
language plpgsql as $$
declare n int;
begin
  execute 'select count(*) from (' || p_sql || ') t' into n;
  if n <> p_expected then
    raise exception 'FALLO: % (esperado %, obtenido %)', p_label, p_expected, n;
  end if;
end $$;
grant execute on function public._test_expect_count(text, int, text) to anon, authenticated;

-- Limpieza preventiva de usuarios de prueba por si quedaron de intentos anteriores
delete from auth.users where email in ('ana@test.com', 'beto@test.com', 'admin@test.com');

-- Usuarios de prueba (el trigger on_auth_user_created debe crear user_profiles)
insert into auth.users (id, aud, role, email) values
  (gen_random_uuid(), 'authenticated', 'authenticated', 'ana@test.com'),
  (gen_random_uuid(), 'authenticated', 'authenticated', 'beto@test.com'),
  (gen_random_uuid(), 'authenticated', 'authenticated', 'admin@test.com');

insert into public._test_ids select split_part(email,'@',1), id from auth.users where email in ('ana@test.com', 'beto@test.com', 'admin@test.com');

select public._test_expect_count('select 1 from public.user_profiles where email in (''ana@test.com'', ''beto@test.com'', ''admin@test.com'')', 3,
  'el trigger debe crear un user_profile por cada usuario');

update public.user_profiles set role = 'admin'
  where id = (select id from public._test_ids where name = 'admin');

-- ---------- Como ANA (profesional) ----------
set local role authenticated;
select set_config('request.jwt.claim.sub', (select id::text from public._test_ids where name='ana'), true);

select public._test_expect_error(
  format($q$insert into public.professionals (owner_id, business_name, slug, status)
            values (%L, 'Ana Plomeria', 'ana-plomeria', 'approved')$q$,
         (select id from public._test_ids where name='ana')),
  'un profesional no puede crear su perfil ya aprobado');

insert into public.professionals (owner_id, business_name, slug, locality_id)
values ((select id from public._test_ids where name='ana'), 'Ana Plomería', 'ana-plomeria',
        (select id from public.localities where slug='puerto-la-cruz'));

select public._test_expect_error(
  $q$update public.professionals set status = 'approved' where slug = 'ana-plomeria'$q$,
  'un profesional no puede aprobarse a sí mismo');
select public._test_expect_error(
  $q$update public.professionals set approved_by = owner_id where slug = 'ana-plomeria'$q$,
  'un profesional no puede escribir approved_by');
select public._test_expect_error(
  $q$update public.user_profiles set role = 'admin'$q$,
  'un usuario no puede cambiar su rol');
select public._test_expect_error(
  $q$select public.admin_set_professional_status(
       (select id from public.professionals limit 1), 'approved')$q$,
  'un profesional no puede usar la función de aprobación');
select public._test_expect_error(
  $q$insert into public.profile_events (professional_id, event_type, visitor_hash, dedupe_key)
     select id, 'visit', 'x', 'x' from public.professionals$q$,
  'un profesional no puede insertar eventos');
select public._test_expect_error(
  $q$insert into public.subscriptions (professional_id, plan_id, status)
     select p.id, (select id from public.plans limit 1), 'active' from public.professionals p$q$,
  'un profesional no puede crear/activar suscripciones');
select public._test_expect_error(
  $q$insert into public.payments (professional_id, amount, payment_method, status)
     select id, 5, 'x', 'approved' from public.professionals$q$,
  'un profesional no puede crear pagos aprobados');
do $$
declare n int;
begin
  update public.plans set price = 0;
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FALLO: un profesional pudo editar planes (% filas)', n;
  end if;
end $$;

-- Teléfonos propios: válido y formato inválido
insert into public.professional_contacts (professional_id, whatsapp_phone, phone)
select id, '+584141234567', '+584141234567' from public.professionals;
select public._test_expect_error(
  $q$update public.professional_contacts set phone = '0414-123'$q$,
  'el teléfono debe tener formato internacional');

-- ---------- Como BETO (otro profesional) ----------
select set_config('request.jwt.claim.sub', (select id::text from public._test_ids where name='beto'), true);
select public._test_expect_count('select 1 from public.professional_contacts', 0,
  'Beto no debe ver los teléfonos de Ana');
select public._test_expect_count('select 1 from public.professionals', 0,
  'Beto no debe ver el perfil pendiente de Ana en la tabla base');

-- ---------- Como VISITANTE (anon) ----------
reset role; set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select public._test_expect_error('select * from public.professionals', 'anon no lee la tabla base');
select public._test_expect_error('select * from public.professional_contacts', 'anon no lee contactos');
select public._test_expect_error('select * from public.profile_events', 'anon no lee eventos');
select public._test_expect_error('select * from public.payments', 'anon no lee pagos');
select public._test_expect_count('select 1 from public.professionals_public', 0,
  'un perfil pendiente no es público');
select public._test_expect_count('select 1 from public.categories', 4, 'anon ve las categorías');
select public._test_expect_count('select 1 from public.localities', 2,
  'anon solo ve localidades activas (etapa 1)');
select public._test_expect_count('select 1 from public.plans', 3, 'anon ve los planes');

-- ---------- Como ADMIN ----------
reset role; set local role authenticated;
select set_config('request.jwt.claim.sub', (select id::text from public._test_ids where name='admin'), true);
select public.admin_set_professional_status(
  (select id from public.professionals where slug='ana-plomeria'), 'approved', 'prueba');
select public._test_expect_count('select 1 from public.professional_contacts', 1,
  'el admin puede leer contactos');

-- ---------- VISITANTE otra vez: ya hay perfil público ----------
reset role; set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select public._test_expect_count('select 1 from public.professionals_public', 1,
  'el perfil aprobado es público');
select public._test_expect_count(
  $q$select 1 from public.professionals_public where contacts_enabled$q$, 1,
  'perfil nuevo: contactos habilitados');
select public._test_expect_count('select 1 from public.listing_combinations', 0,
  'sin categoría asignada no hay página de lista');

-- ---------- Sistema (service_role / SQL): límites de la cuota gratuita ----------
reset role;
insert into public.professional_categories (professional_id, category_id)
select p.id, c.id from public.professionals p, public.categories c where c.slug='plomeria';
select public._test_expect_count('select 1 from public.listing_combinations', 1,
  'con categoría + localidad activa aparece la página de lista');

-- 9 visitas: aún habilitado
insert into public.profile_events (professional_id, event_type, visitor_hash, dedupe_key, counts_toward_free_quota)
select p.id, 'visit', 'v' || g, 'visit' || g, true
from public.professionals p, generate_series(1, 9) g;
select public._test_expect_count(
  $q$select 1 from public.professionals_public where contacts_enabled$q$, 1,
  '9 visitas: contactos aún habilitados');

-- visita duplicada del mismo visitante: debe rechazarse
select public._test_expect_error(
  $q$insert into public.profile_events (professional_id, event_type, visitor_hash, dedupe_key, counts_toward_free_quota)
     select id, 'visit', 'v1', 'visit-dup', true from public.professionals$q$,
  'la misma persona no cuenta dos veces como visita');

-- visita 10: se alcanza el límite
insert into public.profile_events (professional_id, event_type, visitor_hash, dedupe_key, counts_toward_free_quota)
select id, 'visit', 'v10', 'visit10', true from public.professionals;
select public._test_expect_count(
  $q$select 1 from public.professionals_public where contacts_enabled$q$, 0,
  '10 visitas: contactos bloqueados, perfil sigue visible');
select public._test_expect_count('select 1 from public.professionals_public', 1,
  'con límite alcanzado el perfil sigue público');

-- Suscripción activa: vuelve a habilitar
insert into public.subscriptions (professional_id, plan_id, status, starts_at, ends_at)
select p.id, (select id from public.plans where slug='profesional'), 'active',
       now() - interval '1 day', now() + interval '29 days'
from public.professionals p;
select public._test_expect_count(
  $q$select 1 from public.professionals_public where contacts_enabled$q$, 1,
  'suscripción activa: contactos habilitados');

-- Suscripción vencida: bloquea de nuevo (sin depender de un cron)
update public.subscriptions set starts_at = now() - interval '40 days',
  ends_at = now() - interval '10 days';
select public._test_expect_count(
  $q$select 1 from public.professionals_public where contacts_enabled$q$, 0,
  'suscripción vencida: contactos bloqueados otra vez');

-- Activa sin fechas: prohibido
select public._test_expect_error(
  $q$insert into public.subscriptions (professional_id, plan_id, status)
     select id, (select id from public.plans limit 1), 'active' from public.professionals$q$,
  'una suscripción activa exige fechas');

-- Auditoría
select public._test_expect_count(
  $q$select 1 from public.audit_logs where entity_type='professionals' and action='update'
     and details ->> 'note' = 'prueba'$q$, 1,
  'la aprobación quedó registrada en audit_logs con su nota');

select 'TODAS LAS PRUEBAS PASARON' as resultado;
rollback;
