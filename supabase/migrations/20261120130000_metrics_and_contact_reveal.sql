-- =====================================================================
-- HIRAM DIRECTORY - MIGRACIÓN FASE 4: MÉTRICAS, LÍMITES Y CONTACTOS
-- =====================================================================
-- Implementa:
--  1. public.record_profile_visit: Registro seguro de visitas únicas.
--  2. public.reveal_professional_contact: Revelado atómico de teléfonos
--     con control de concurrencia (FOR UPDATE), validación de límites
--     y registro de eventos de contacto.
--  3. public.get_professional_metrics: Consulta de métricas y consumo
--     de cuota exclusiva para el dueño del perfil o administrador.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. REGISTRO DE VISITA ÚNICA
-- ---------------------------------------------------------------------
create or replace function public.record_profile_visit(
  p_professional_id uuid,
  p_visitor_hash text,
  p_dedupe_key text
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
  -- Verificar que el profesional exista y esté aprobado
  if not exists (
    select 1 from public.professionals
    where id = p_professional_id and status = 'approved'
  ) then
    return false;
  end if;

  -- Comprobar si quien visita es el dueño o admin (no cuenta para la cuota)
  if (select auth.uid()) is not null and (
    private.owns_professional(p_professional_id) or private.is_admin()
  ) then
    v_is_owner_or_admin := true;
  end if;

  v_has_active_sub := private.has_active_subscription(p_professional_id);

  -- Solo cuenta para la cuota gratuita si NO es dueño/admin y NO tiene suscripción activa
  if not v_is_owner_or_admin and not v_has_active_sub then
    v_counts_toward_quota := true;
  else
    v_counts_toward_quota := false;
  end if;

  -- Si este visitante ya registró una visita previa para este perfil, no duplicar
  if exists (
    select 1 from public.profile_events
    where professional_id = p_professional_id
      and visitor_hash = p_visitor_hash
      and event_type = 'visit'
  ) then
    return false;
  end if;

  -- Insertar la visita única
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
exception when others then
  return false;
end;
$$;

grant execute on function public.record_profile_visit(uuid, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. REVELADO ATÓMICO DE CONTACTOS (WhatsApp y Llamada)
-- ---------------------------------------------------------------------
create or replace function public.reveal_professional_contact(
  p_professional_id uuid,
  p_channel text,
  p_visitor_hash text,
  p_dedupe_key text
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
  v_is_owner_or_admin boolean := false;
  v_counts_toward_quota boolean := false;
  v_is_quota_contact boolean := false;
  v_already_contacted boolean := false;
  v_contacts_enabled boolean := false;
  v_target_phone text := null;
  v_event_type public.profile_event_type;
  v_quota record;
begin
  -- 1. Validar canal
  if p_channel not in ('whatsapp', 'call') then
    raise exception 'Canal de contacto inválido' using errcode = '22023';
  end if;

  v_event_type := case
    when p_channel = 'whatsapp' then 'whatsapp_click'::public.profile_event_type
    else 'call_click'::public.profile_event_type
  end;

  -- 2. Control de concurrencia: bloqueo de fila exclusivo (FOR UPDATE)
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

  -- 3. Identificar si es dueño o admin
  if (select auth.uid()) is not null and (
    v_prof.owner_id = (select auth.uid()) or private.is_admin()
  ) then
    v_is_owner_or_admin := true;
  end if;

  -- 4. Comprobar suscripción activa (ends_at > now())
  v_has_active_sub := private.has_active_subscription(p_professional_id);

  -- 5. Comprobar si los contactos están habilitados según la cuota
  v_contacts_enabled := v_has_active_sub or (
    select q.visits < q.visit_limit and q.contacts < q.contact_limit
    from private.free_quota(p_professional_id) q
  );

  -- Si la cuota fue alcanzada y no es dueño/admin, denegar la entrega del teléfono
  if not v_contacts_enabled and not v_is_owner_or_admin then
    return jsonb_build_object(
      'authorized', false,
      'is_quota_exhausted', true,
      'message', 'Este profesional ha alcanzado el límite de contactos de su cuota gratuita.'
    );
  end if;

  -- 6. Obtener el teléfono privado desde professional_contacts
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

  -- 7. Determinar contabilización de la cuota:
  if v_is_owner_or_admin or v_has_active_sub then
    v_counts_toward_quota := false;
    v_is_quota_contact := false;
  else
    v_counts_toward_quota := true;

    -- Comprobar si este visitante ya realizó un contacto previo a este perfil
    select exists (
      select 1 from public.profile_events
      where professional_id = p_professional_id
        and visitor_hash = p_visitor_hash
        and is_quota_contact = true
    ) into v_already_contacted;

    -- Regla de negocio: WhatsApp y llamada del mismo visitante cuentan como UNO solo
    if not v_already_contacted then
      v_is_quota_contact := true;
    else
      v_is_quota_contact := false;
    end if;
  end if;

  -- 8. Registrar el evento en profile_events
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

  -- 9. Retornar información autorizada y estado actual de cuota
  select * into v_quota from private.free_quota(p_professional_id);

  return jsonb_build_object(
    'authorized', true,
    'channel', p_channel,
    'phone', v_target_phone,
    'has_active_sub', v_has_active_sub,
    'is_owner_or_admin', v_is_owner_or_admin,
    'quota', jsonb_build_object(
      'visits', v_quota.visits,
      'contacts', v_quota.contacts,
      'visit_limit', v_quota.visit_limit,
      'contact_limit', v_quota.contact_limit
    )
  );
end;
$$;

grant execute on function public.reveal_professional_contact(uuid, text, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. CONSULTA DE MÉTRICAS PRIVADAS DEL PROFESIONAL
-- ---------------------------------------------------------------------
create or replace function public.get_professional_metrics(p_professional_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_quota record;
  v_sub record;
  v_stats record;
begin
  -- Exclusivo para el dueño del perfil o administradores
  if not (private.owns_professional(p_professional_id) or private.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
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

grant execute on function public.get_professional_metrics(uuid)
  to authenticated;
