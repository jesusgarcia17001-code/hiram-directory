-- =====================================================================
-- FASE: Seguridad Service Role + Modo Lanzamiento y Cobro
-- Orden: Construido sobre exchange_rates y payment_settings
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. VALORES INICIALES EN: app_settings
-- ---------------------------------------------------------------------
insert into public.app_settings (key, value)
values
  ('billing_enabled', 'false'::jsonb),
  ('billing_enabled_at', 'null'::jsonb),
  ('launch_banner_text', '"¡Lanzamiento en Anzoátegui! Disfruta de perfiles y contactos 100% gratuitos por tiempo limitado."'::jsonb),
  ('launch_banner_enabled', 'true'::jsonb)
on conflict (key) do nothing;


-- ---------------------------------------------------------------------
-- 2. FUNCIÓN INTERNA: private.is_billing_enabled()
-- ---------------------------------------------------------------------
create or replace function private.is_billing_enabled()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select (s.value #>> '{}')::boolean
     from public.app_settings s
     where s.key = 'billing_enabled'),
    false
  );
$$;


-- ---------------------------------------------------------------------
-- 3. SEGURIDAD: TRIGGER CONTRA UPDATE DIRECTO EN app_settings
-- Prohíbe modificar billing_enabled por UPDATE directo fuera de admin_set_billing_enabled
-- ---------------------------------------------------------------------
create or replace function private.protect_billing_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.key in ('billing_enabled', 'billing_enabled_at') then
    if current_setting('app.admin_setting_billing', true) is distinct from 'on' then
      raise exception 'Modificación directa prohibida: use la función admin_set_billing_enabled' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_billing_settings_trigger on public.app_settings;
create trigger protect_billing_settings_trigger
  before update on public.app_settings
  for each row
  execute function private.protect_billing_settings();


-- ---------------------------------------------------------------------
-- 4. FUNCIÓN ADMINISTRATIVA: admin_set_billing_enabled
-- ---------------------------------------------------------------------
create or replace function public.admin_set_billing_enabled(
  p_enabled boolean,
  p_banner_text text default null,
  p_banner_enabled boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_old_enabled boolean;
  v_now timestamptz := now();
begin
  if not private.is_admin() then
    raise exception 'No autorizado: requiere rol de administrador' using errcode = '42501';
  end if;

  select coalesce((value #>> '{}')::boolean, false) into v_old_enabled
  from public.app_settings
  where key = 'billing_enabled';

  -- Activar flag de sesión requerida por el trigger
  perform set_config('app.admin_setting_billing', 'on', true);

  -- 1. Actualizar billing_enabled
  update public.app_settings
  set value = to_jsonb(p_enabled), updated_at = v_now
  where key = 'billing_enabled';

  -- 2. Si pasa a true y no tenía fecha previa, fijar billing_enabled_at
  if p_enabled and (v_old_enabled is false or v_old_enabled is null) then
    update public.app_settings
    set value = to_jsonb(v_now::text), updated_at = v_now
    where key = 'billing_enabled_at';
  end if;

  -- 3. Configuración del banner opcional
  if p_banner_text is not null then
    update public.app_settings
    set value = to_jsonb(p_banner_text), updated_at = v_now
    where key = 'launch_banner_text';
  end if;

  if p_banner_enabled is not null then
    update public.app_settings
    set value = to_jsonb(p_banner_enabled), updated_at = v_now
    where key = 'launch_banner_enabled';
  end if;

  -- 4. Auditoría
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    v_admin_id,
    case when p_enabled then 'billing.enabled' else 'billing.disabled' end,
    'app_settings',
    null,
    jsonb_build_object(
      'billing_enabled', p_enabled,
      'previous_state', v_old_enabled,
      'changed_at', v_now
    )
  );

  return jsonb_build_object(
    'success', true,
    'billing_enabled', p_enabled,
    'billing_enabled_at', case when p_enabled then v_now else null end
  );
end;
$$;

revoke execute on function public.admin_set_billing_enabled from public, anon;
grant execute on function public.admin_set_billing_enabled to authenticated;


-- ---------------------------------------------------------------------
-- 5. FUNCIÓN PÚBLICA: get_billing_status()
-- ---------------------------------------------------------------------
create or replace function public.get_billing_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'billing_enabled', coalesce((select (value #>> '{}')::boolean from public.app_settings where key = 'billing_enabled'), false),
    'billing_enabled_at', (select value #>> '{}' from public.app_settings where key = 'billing_enabled_at'),
    'launch_banner_text', (select value #>> '{}' from public.app_settings where key = 'launch_banner_text'),
    'launch_banner_enabled', coalesce((select (value #>> '{}')::boolean from public.app_settings where key = 'launch_banner_enabled'), false)
  );
$$;

revoke execute on function public.get_billing_status from public;
grant execute on function public.get_billing_status to anon, authenticated;


-- ---------------------------------------------------------------------
-- 6. ACTUALIZACIÓN DE: private.contacts_enabled(uuid)
-- Con billing_enabled = false, los contactos SIEMPRE están habilitados
-- ---------------------------------------------------------------------
create or replace function private.contacts_enabled(p_professional_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    not private.is_billing_enabled()
    or private.has_active_subscription(p_professional_id)
    or (
      select q.visits < q.visit_limit and q.contacts < q.contact_limit
      from private.free_quota(p_professional_id) q
    );
$$;


-- ---------------------------------------------------------------------
-- 7. ENDURECIMIENTO Y MODO LANZAMIENTO: record_profile_visit
-- (Firma con p_actor_id, sin contexto anonimo de sesion, sin captura silenciosa de errores, SOLO service_role)
-- ---------------------------------------------------------------------
drop function if exists public.record_profile_visit(uuid, text, text);
drop function if exists public.record_profile_visit(uuid, text, text, uuid);

create or replace function public.record_profile_visit(
  p_professional_id uuid,
  p_visitor_hash text,
  p_dedupe_key text,
  p_actor_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_owner_or_admin boolean := false;
  v_has_active_sub boolean := false;
  v_counts_toward_quota boolean := false;
begin
  if not exists (
    select 1 from public.professionals
    where id = p_professional_id and status = 'approved'
  ) then
    return false;
  end if;

  -- Comprobar si p_actor_id es dueño o admin
  if p_actor_id is not null then
    if exists (
      select 1 from public.professionals
      where id = p_professional_id and owner_id = p_actor_id
    ) or exists (
      select 1 from public.user_profiles
      where id = p_actor_id and role = 'admin'
    ) then
      v_is_owner_or_admin := true;
    end if;
  end if;

  v_has_active_sub := private.has_active_subscription(p_professional_id);

  -- En modo lanzamiento (billing_enabled = false), NUNCA consume cuota
  if not private.is_billing_enabled() then
    v_counts_toward_quota := false;
  elsif not v_is_owner_or_admin and not v_has_active_sub then
    v_counts_toward_quota := true;
  else
    v_counts_toward_quota := false;
  end if;

  if exists (
    select 1 from public.profile_events
    where professional_id = p_professional_id
      and visitor_hash = p_visitor_hash
      and event_type = 'visit'
  ) then
    return false;
  end if;

  -- Errores no silenciados para propagar excepciones reales al servidor
  insert into public.profile_events (
    professional_id,
    event_type,
    visitor_hash,
    dedupe_key,
    channel,
    counts_toward_free_quota,
    is_quota_contact
  )
  values (
    p_professional_id,
    'visit',
    p_visitor_hash,
    p_dedupe_key,
    null,
    v_counts_toward_quota,
    false
  )
  on conflict (dedupe_key) do nothing;

  return true;
end;
$$;

-- Permisos estrictos: revocados de anon y authenticated; SOLO service_role
revoke execute on function public.record_profile_visit(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.record_profile_visit(uuid, text, text, uuid) to service_role;


-- ---------------------------------------------------------------------
-- 8. ENDURECIMIENTO Y MODO LANZAMIENTO: reveal_professional_contact
-- (Firma con p_actor_id, sin contexto de sesion anonimo, sin raw_urlencode, SOLO service_role)
-- ---------------------------------------------------------------------
drop function if exists public.reveal_professional_contact(uuid, text, text, text);
drop function if exists public.reveal_professional_contact(uuid, text, text, text, uuid);

create or replace function public.reveal_professional_contact(
  p_professional_id uuid,
  p_channel text,
  p_visitor_hash text,
  p_dedupe_key text,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prof record;
  v_contact record;
  v_has_active_sub boolean;
  v_billing_enabled boolean;
  v_is_owner_or_admin boolean := false;
  v_counts_toward_quota boolean := false;
  v_is_quota_contact boolean := false;
  v_already_contacted boolean := false;
  v_contacts_enabled boolean := false;
  v_target_phone text := null;
  v_event_type public.profile_event_type;
begin
  if p_channel not in ('whatsapp', 'call') then
    raise exception 'Canal de contacto inválido' using errcode = '22023';
  end if;

  v_event_type := case
    when p_channel = 'whatsapp' then 'whatsapp_click'::public.profile_event_type
    else 'call_click'::public.profile_event_type
  end;

  select id, status, owner_id into v_prof
  from public.professionals
  where id = p_professional_id
  for update;

  if not found then
    raise exception 'Profesional no encontrado' using errcode = 'P0002';
  end if;

  if v_prof.status <> 'approved' then
    return jsonb_build_object(
      'authorized', false,
      'message', 'El perfil no se encuentra activo.'
    );
  end if;

  -- Comprobar si p_actor_id es dueño o admin
  if p_actor_id is not null then
    if v_prof.owner_id = p_actor_id or exists (
      select 1 from public.user_profiles
      where id = p_actor_id and role = 'admin'
    ) then
      v_is_owner_or_admin := true;
    end if;
  end if;

  v_billing_enabled := private.is_billing_enabled();
  v_has_active_sub := private.has_active_subscription(p_professional_id);

  -- En modo lanzamiento, los contactos SIEMPRE están habilitados
  if not v_billing_enabled then
    v_contacts_enabled := true;
  else
    v_contacts_enabled := v_has_active_sub or (
      select q.visits < q.visit_limit and q.contacts < q.contact_limit
      from private.free_quota(p_professional_id) q
    );
  end if;

  if not v_contacts_enabled and not v_is_owner_or_admin then
    return jsonb_build_object(
      'authorized', false,
      'is_quota_exhausted', true,
      'message', 'Este profesional ha alcanzado el límite de contactos de su cuota gratuita.'
    );
  end if;

  select whatsapp_phone, phone into v_contact
  from public.professional_contacts
  where professional_id = p_professional_id;

  if p_channel = 'whatsapp' then
    v_target_phone := coalesce(v_contact.whatsapp_phone, v_contact.phone);
  else
    v_target_phone := coalesce(v_contact.phone, v_contact.whatsapp_phone);
  end if;

  if v_target_phone is null then
    return jsonb_build_object(
      'authorized', false,
      'message', 'El profesional no tiene un número configurado para este canal.'
    );
  end if;

  -- En modo lanzamiento (billing_enabled = false), NUNCA consume cuota (ambos false)
  if not v_billing_enabled or v_is_owner_or_admin or v_has_active_sub then
    v_counts_toward_quota := false;
    v_is_quota_contact := false;
  else
    v_counts_toward_quota := true;
    select exists (
      select 1 from public.profile_events
      where professional_id = p_professional_id
        and visitor_hash = p_visitor_hash
        and is_quota_contact = true
    ) into v_already_contacted;

    if not v_already_contacted then
      v_is_quota_contact := true;
    else
      v_is_quota_contact := false;
    end if;
  end if;

  insert into public.profile_events (
    professional_id,
    event_type,
    visitor_hash,
    dedupe_key,
    channel,
    counts_toward_free_quota,
    is_quota_contact
  ) values (
    p_professional_id,
    v_event_type,
    p_visitor_hash,
    p_dedupe_key,
    p_channel,
    v_counts_toward_quota,
    v_is_quota_contact
  )
  on conflict (dedupe_key) do nothing;

  -- Solo se devuelve el teléfono y el canal; el enlace y texto se arman en la app
  return jsonb_build_object(
    'authorized', true,
    'channel', p_channel,
    'phone', v_target_phone
  );
end;
$$;

-- Permisos estrictos: revocados de anon y authenticated; SOLO service_role
revoke execute on function public.reveal_professional_contact(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.reveal_professional_contact(uuid, text, text, text, uuid) to service_role;


-- ---------------------------------------------------------------------
-- 9. REFINAMIENTO DE: get_professional_metrics
-- Soporte para p_actor_id con service_role (el id de sesión es nulo en service_role)
-- Revocado a anon y authenticated; SOLO ejecutable por service_role
-- ---------------------------------------------------------------------
drop function if exists public.get_professional_metrics(uuid);
drop function if exists public.get_professional_metrics(uuid, uuid);

create or replace function public.get_professional_metrics(
  p_professional_id uuid,
  p_actor_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_is_owner_or_admin boolean := false;
  v_quota record;
  v_sub record;
  v_stats record;
begin
  -- Validar que p_actor_id (o auth.uid()) sea el dueño del perfil o un administrador
  if p_actor_id is not null then
    if exists (
      select 1 from public.professionals
      where id = p_professional_id and owner_id = p_actor_id
    ) or exists (
      select 1 from public.user_profiles
      where id = p_actor_id and role = 'admin'
    ) then
      v_is_owner_or_admin := true;
    end if;
  elsif (select auth.uid()) is not null then
    if private.owns_professional(p_professional_id) or private.is_admin() then
      v_is_owner_or_admin := true;
    end if;
  end if;

  if not v_is_owner_or_admin then
    raise exception 'No autorizado: no tienes permisos para consultar las métricas de este perfil'
      using errcode = '42501';
  end if;

  select * into v_quota from private.free_quota(p_professional_id);

  select
    count(*) filter (where event_type = 'impression')::int as total_impressions,
    count(*) filter (where event_type = 'visit')::int as total_visits,
    count(*) filter (where event_type = 'whatsapp_click')::int as total_whatsapp,
    count(*) filter (where event_type = 'call_click')::int as total_calls
  into v_stats
  from public.profile_events
  where professional_id = p_professional_id;

  select status, starts_at, ends_at into v_sub
  from public.subscriptions
  where professional_id = p_professional_id
    and status = 'active'
    and starts_at <= now()
    and ends_at > now()
  order by ends_at desc
  limit 1;

  return jsonb_build_object(
    'quota', jsonb_build_object(
      'visits', v_quota.visits,
      'contacts', v_quota.contacts,
      'visit_limit', v_quota.visit_limit,
      'contact_limit', v_quota.contact_limit,
      'is_contacts_enabled', private.contacts_enabled(p_professional_id)
    ),
    'stats', jsonb_build_object(
      'total_impressions', coalesce(v_stats.total_impressions, 0),
      'total_visits', coalesce(v_stats.total_visits, 0),
      'total_whatsapp', coalesce(v_stats.total_whatsapp, 0),
      'total_calls', coalesce(v_stats.total_calls, 0)
    ),
    'subscription', case when v_sub.status is not null then
      jsonb_build_object(
        'is_active', true,
        'starts_at', v_sub.starts_at,
        'ends_at', v_sub.ends_at
      )
    else
      jsonb_build_object('is_active', false)
    end
  );
end;
$$;

revoke execute on function public.get_professional_metrics(uuid, uuid) from public, anon, authenticated;
grant execute on function public.get_professional_metrics(uuid, uuid) to service_role;


-- ---------------------------------------------------------------------
-- 10. ELIMINACIÓN DE SOBRECARGAS Y NUEVA: submit_manual_payment
-- (DROP explícito de versiones viejas, SIN p_amount en la nueva firma)
-- ---------------------------------------------------------------------
drop function if exists public.submit_manual_payment(uuid, uuid, numeric, text, text, text, text, integer);
drop function if exists public.submit_manual_payment(uuid, uuid, text, text, text, text, integer, numeric);
drop function if exists public.submit_manual_payment(uuid, uuid, text, text, text, text, integer);

create or replace function public.submit_manual_payment(
  p_professional_id uuid,
  p_plan_id uuid,
  p_payment_method text,
  p_reference_number text,
  p_receipt_storage_path text,
  p_receipt_mime_type text,
  p_receipt_size_bytes integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_plan record;
  v_active_rate record;
  v_sub_id uuid;
  v_payment_id uuid;
  v_amount_bs numeric(18,2);
begin
  if v_user_id is null then
    raise exception 'No autenticado' using errcode = '42501';
  end if;

  -- 1. Si el cobro está inactivo (lanzamiento gratuito), rechazar el pago con mensaje claro
  if not private.is_billing_enabled() then
    raise exception 'El cobro aún no está activo. La plataforma se encuentra en fase de lanzamiento gratuito.' using errcode = '22023';
  end if;

  if not (private.owns_professional(p_professional_id) or private.is_admin()) then
    raise exception 'No autorizado: no eres dueño de este perfil' using errcode = '42501';
  end if;

  select id, name, price, duration_days into v_plan
  from public.plans
  where id = p_plan_id and is_active = true;

  if not found then
    raise exception 'Plan no disponible o inactivo' using errcode = 'P0002';
  end if;

  if v_plan.price <= 0 then
    raise exception 'El plan seleccionado no requiere pago monetario' using errcode = '22023';
  end if;

  -- 2. La tasa se lee dentro de la BD y el monto se calcula aquí (sin recibir p_amount)
  select id, rate, source_updated_at into v_active_rate
  from public.exchange_rates
  where currency_pair = 'USD_VES' and is_active = true
  limit 1;

  if not found or v_active_rate.rate is null or v_active_rate.rate <= 0 then
    raise exception 'No hay una tasa de cambio oficial activa en el sistema. Por favor intente más tarde o comuníquese con soporte.' using errcode = 'P0002';
  end if;

  v_amount_bs := round((v_plan.price * v_active_rate.rate), 2);

  if trim(coalesce(p_payment_method, '')) = '' then
    raise exception 'El método de pago es requerido' using errcode = '22023';
  end if;

  if trim(coalesce(p_reference_number, '')) = '' then
    raise exception 'El número de referencia es requerido' using errcode = '22023';
  end if;

  if trim(coalesce(p_receipt_storage_path, '')) = '' then
    raise exception 'La ruta del comprobante es requerida' using errcode = '22023';
  end if;

  insert into public.subscriptions (
    professional_id,
    plan_id,
    status
  )
  values (
    p_professional_id,
    p_plan_id,
    'pending'::public.subscription_status
  )
  returning id into v_sub_id;

  insert into public.payments (
    professional_id,
    subscription_id,
    amount,
    currency,
    payment_method,
    reference_number,
    status,
    amount_usd,
    rate_used,
    amount_bs,
    rate_date
  )
  values (
    p_professional_id,
    v_sub_id,
    v_plan.price,
    'USD',
    p_payment_method,
    p_reference_number,
    'pending'::public.payment_status,
    v_plan.price,
    v_active_rate.rate,
    v_amount_bs,
    v_active_rate.source_updated_at
  )
  returning id into v_payment_id;

  insert into public.payment_receipts (
    payment_id,
    storage_path,
    mime_type,
    size_bytes
  )
  values (
    v_payment_id,
    p_receipt_storage_path,
    p_receipt_mime_type,
    p_receipt_size_bytes
  );

  return jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'subscription_id', v_sub_id,
    'amount_usd', v_plan.price,
    'amount_bs', v_amount_bs,
    'rate_used', v_active_rate.rate
  );
end;
$$;

revoke execute on function public.submit_manual_payment(uuid, uuid, text, text, text, text, integer) from public, anon;
grant execute on function public.submit_manual_payment(uuid, uuid, text, text, text, text, integer) to authenticated;


-- ---------------------------------------------------------------------
-- 11. ENDURECIMIENTO DE POLÍTICA RLS: payment_settings
-- Solo lectura si billing_enabled = true Y el usuario posee un perfil profesional,
-- o si el usuario es administrador. Los administradores siempre leen.
-- ---------------------------------------------------------------------
drop policy if exists "Authenticated read payment settings" on public.payment_settings;
drop policy if exists "Professionals read payment settings when billing enabled" on public.payment_settings;

create policy "Professionals read payment settings when billing enabled" on public.payment_settings
  for select to authenticated
  using (
    private.is_admin()
    or (
      is_active = true
      and private.is_billing_enabled()
      and exists (
        select 1 from public.professionals
        where owner_id = (select auth.uid())
      )
    )
  );
