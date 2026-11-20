-- =====================================================================
-- FASE 5: Pagos Manuales y Activación de Suscripciones
-- =====================================================================

-- 1. Función para que el profesional envíe un reporte de pago manual
create or replace function public.submit_manual_payment(
  p_professional_id uuid,
  p_plan_id uuid,
  p_amount numeric,
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
  v_sub_id uuid;
  v_payment_id uuid;
begin
  if v_user_id is null then
    raise exception 'No autenticado' using errcode = '42501';
  end if;

  -- Validar que el profesional pertenece al usuario actual (o es admin)
  if not (private.owns_professional(p_professional_id) or private.is_admin()) then
    raise exception 'No autorizado: no eres dueño de este perfil' using errcode = '42501';
  end if;

  -- Validar plan activo
  select id, name, price, duration_days into v_plan
  from public.plans
  where id = p_plan_id and is_active = true;

  if not found then
    raise exception 'Plan no disponible o inactivo' using errcode = 'P0002';
  end if;

  if p_amount <= 0 then
    raise exception 'El monto del pago debe ser mayor a 0' using errcode = '22023';
  end if;

  if trim(coalesce(p_payment_method, '')) = '' then
    raise exception 'El método de pago es requerido' using errcode = '22023';
  end if;

  if trim(coalesce(p_reference_number, '')) = '' then
    raise exception 'El número de referencia es requerido' using errcode = '22023';
  end if;

  if trim(coalesce(p_receipt_storage_path, '')) = '' then
    raise exception 'La ruta del comprobante es requerida' using errcode = '22023';
  end if;

  -- 1. Crear registro de suscripción en estado 'pending'
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

  -- 2. Crear registro de pago en estado 'pending'
  insert into public.payments (
    professional_id,
    subscription_id,
    amount,
    currency,
    payment_method,
    reference_number,
    status
  )
  values (
    p_professional_id,
    v_sub_id,
    p_amount,
    'USD',
    p_payment_method,
    p_reference_number,
    'pending'::public.payment_status
  )
  returning id into v_payment_id;

  -- 3. Crear registro de comprobante en payment_receipts
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
    'subscription_id', v_sub_id
  );
end;
$$;

-- 2. Función administrativa para verificar y aprobar o rechazar un pago
create or replace function public.admin_review_payment(
  p_payment_id uuid,
  p_decision text,
  p_rejection_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_payment record;
  v_sub record;
  v_plan record;
  v_duration integer;
  v_active_sub record;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  -- Solo administradores pueden revisar pagos
  if not private.is_admin() then
    raise exception 'No autorizado: requiere rol de administrador' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decisión inválida. Debe ser "approved" o "rejected"' using errcode = '22023';
  end if;

  -- Bloquear fila de pago para evitar condiciones de carrera
  select id, professional_id, subscription_id, amount, status
  into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Pago no encontrado' using errcode = 'P0002';
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'El pago ya ha sido procesado anteriormente' using errcode = '22023';
  end if;

  select id, professional_id, plan_id, status
  into v_sub
  from public.subscriptions
  where id = v_payment.subscription_id
  for update;

  if p_decision = 'approved' then
    -- Obtener duración del plan
    select duration_days into v_plan
    from public.plans
    where id = v_sub.plan_id;

    v_duration := coalesce(v_plan.duration_days, 30);

    -- Verificar si ya tenía una suscripción activa previa para extenderla
    select id, starts_at, ends_at into v_active_sub
    from public.subscriptions
    where professional_id = v_payment.professional_id
      and status = 'active'
      and ends_at > now()
      and id <> v_sub.id
    order by ends_at desc
    limit 1;

    if found then
      -- Extender la suscripción a partir del vencimiento actual
      v_starts_at := v_active_sub.starts_at;
      v_ends_at := v_active_sub.ends_at + (v_duration || ' days')::interval;
    else
      -- Nueva suscripción a partir de hoy
      v_starts_at := now();
      v_ends_at := now() + (v_duration || ' days')::interval;
    end if;

    -- Actualizar pago a 'approved'
    update public.payments
    set status = 'approved'::public.payment_status,
        reviewed_by = v_admin_id,
        reviewed_at = now()
    where id = p_payment_id;

    -- Activar la suscripción con fechas válidas
    update public.subscriptions
    set status = 'active'::public.subscription_status,
        starts_at = v_starts_at,
        ends_at = v_ends_at,
        activated_by = v_admin_id,
        updated_at = now()
    where id = v_sub.id;

    -- Registrar auditoría obligatoria (CLAUDE.md)
    insert into public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      details
    )
    values (
      v_admin_id,
      'payment_approved',
      'payments',
      p_payment_id,
      jsonb_build_object(
        'subscription_id', v_sub.id,
        'starts_at', v_starts_at,
        'ends_at', v_ends_at,
        'amount', v_payment.amount
      )
    );

    return jsonb_build_object(
      'success', true,
      'status', 'approved',
      'starts_at', v_starts_at,
      'ends_at', v_ends_at
    );

  else
    -- Caso rechazo
    if trim(coalesce(p_rejection_reason, '')) = '' then
      raise exception 'Debe proporcionar un motivo para rechazar el pago' using errcode = '22023';
    end if;

    update public.payments
    set status = 'rejected'::public.payment_status,
        reviewed_by = v_admin_id,
        reviewed_at = now(),
        rejection_reason = trim(p_rejection_reason)
    where id = p_payment_id;

    update public.subscriptions
    set status = 'cancelled'::public.subscription_status,
        updated_at = now()
    where id = v_sub.id;

    -- Registrar auditoría
    insert into public.audit_logs (
      actor_id,
      action,
      entity_type,
      entity_id,
      details
    )
    values (
      v_admin_id,
      'payment_rejected',
      'payments',
      p_payment_id,
      jsonb_build_object(
        'subscription_id', v_sub.id,
        'reason', trim(p_rejection_reason)
      )
    );

    return jsonb_build_object(
      'success', true,
      'status', 'rejected',
      'reason', trim(p_rejection_reason)
    );
  end if;
end;
$$;

-- 3. Permisos de ejecución
grant execute on function public.submit_manual_payment(
  uuid, uuid, numeric, text, text, text, text, integer
) to authenticated;

grant execute on function public.admin_review_payment(
  uuid, text, text
) to authenticated;
