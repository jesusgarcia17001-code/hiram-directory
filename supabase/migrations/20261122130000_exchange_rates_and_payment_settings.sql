-- =====================================================================
-- FASE: Pago Móvil + Tasa BCV Automática
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TABLA: exchange_rates (Tasas de Cambio)
-- ---------------------------------------------------------------------
create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  currency_pair text not null default 'USD_VES',
  rate numeric(18,4) not null check (rate > 0),
  source text not null check (source in ('cotizave', 'manual')),
  source_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  created_by uuid references public.user_profiles(id) on delete set null,
  is_active boolean not null default false,
  status text not null default 'active' check (status in ('active', 'pending_approval', 'superseded', 'rejected')),
  variation_percentage numeric(8,4) default null,
  metadata jsonb not null default '{}'::jsonb
);

-- Solo puede haber UNA tasa activa por par de divisas (USD_VES)
create unique index if not exists exchange_rates_one_active_per_pair
  on public.exchange_rates (currency_pair)
  where is_active = true;

create index if not exists exchange_rates_created_at_idx
  on public.exchange_rates (created_at desc);

create index if not exists exchange_rates_status_idx
  on public.exchange_rates (status);

-- RLS en exchange_rates
alter table public.exchange_rates enable row level security;

-- Lectura pública SOLO de la tasa activa (para calcular y mostrar monto en Bs al usuario)
-- Admins pueden leer el historial completo
create policy "Public read active exchange rate" on public.exchange_rates
  for select to anon, authenticated
  using (is_active = true or private.is_admin());

-- Modificación: solo administradores autenticados (y service_role que omite RLS)
create policy "Admins manage exchange rates" on public.exchange_rates
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant select on public.exchange_rates to anon, authenticated;
grant insert, update on public.exchange_rates to authenticated;


-- ---------------------------------------------------------------------
-- 2. TABLA: payment_settings (Ajustes de Pago Móvil)
-- ---------------------------------------------------------------------
create table if not exists public.payment_settings (
  id text primary key default 'pago_movil',
  bank_name text not null default '',
  bank_code text not null default '0105',
  id_type text not null default 'J' check (id_type in ('V', 'E', 'J', 'G')),
  id_number text not null default '',
  phone text not null default '',
  account_holder text not null default '',
  instructions text not null default '',
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.user_profiles(id) on delete set null
);

-- Insertar plantilla inicial vacía para que el admin la configure desde /admin/ajustes-pago
insert into public.payment_settings (
  id, bank_name, bank_code, id_type, id_number, phone, account_holder, instructions, is_active
)
values (
  'pago_movil',
  'Banco Mercantil',
  '0105',
  'J',
  '',
  '',
  '',
  'Por favor realiza el Pago Móvil por el monto exacto en Bolívares y adjunta la captura con el número de referencia legible.',
  true
)
on conflict (id) do nothing;

-- RLS en payment_settings
alter table public.payment_settings enable row level security;

-- Lectura: disponible para usuarios autenticados que van a pagar (y admins)
create policy "Authenticated read payment settings" on public.payment_settings
  for select to authenticated
  using (is_active = true or private.is_admin());

-- Modificación: exclusivo administradores
create policy "Admins manage payment settings" on public.payment_settings
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant select on public.payment_settings to authenticated;
grant insert, update on public.payment_settings to authenticated;


-- ---------------------------------------------------------------------
-- 3. COLUMNAS NUEVAS EN: payments
-- ---------------------------------------------------------------------
alter table public.payments
  add column if not exists amount_usd numeric(12,2),
  add column if not exists rate_used numeric(18,4),
  add column if not exists amount_bs numeric(18,2),
  add column if not exists rate_date timestamptz;


-- ---------------------------------------------------------------------
-- 4. ACTUALIZACIÓN SEGURA DE: submit_manual_payment
-- Lee la tasa activa dentro de la base de datos (inmune a manipulación del cliente)
-- ---------------------------------------------------------------------
create or replace function public.submit_manual_payment(
  p_professional_id uuid,
  p_plan_id uuid,
  p_payment_method text,
  p_reference_number text,
  p_receipt_storage_path text,
  p_receipt_mime_type text,
  p_receipt_size_bytes integer,
  p_amount numeric default null -- Parámetro opcional: se ignora y se calcula en el servidor
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

  -- Validar que el profesional pertenece al usuario actual (o es admin)
  if not (private.owns_professional(p_professional_id) or private.is_admin()) then
    raise exception 'No autorizado: no eres dueño de este perfil' using errcode = '42501';
  end if;

  -- 1. Validar plan activo y obtener precio oficial en USD
  select id, name, price, duration_days into v_plan
  from public.plans
  where id = p_plan_id and is_active = true;

  if not found then
    raise exception 'Plan no disponible o inactivo' using errcode = 'P0002';
  end if;

  if v_plan.price <= 0 then
    raise exception 'El plan seleccionado no requiere pago monetario' using errcode = '22023';
  end if;

  -- 2. Leer la tasa de cambio activa dentro de la base de datos
  select id, rate, source_updated_at into v_active_rate
  from public.exchange_rates
  where currency_pair = 'USD_VES' and is_active = true
  limit 1;

  if not found or v_active_rate.rate is null or v_active_rate.rate <= 0 then
    raise exception 'No hay una tasa de cambio oficial activa en el sistema. Por favor intente más tarde o comuníquese con soporte.' using errcode = 'P0002';
  end if;

  -- 3. Calcular monto en Bolívares
  v_amount_bs := round((v_plan.price * v_active_rate.rate), 2);

  -- 4. Validar campos obligatorios del reporte
  if trim(coalesce(p_payment_method, '')) = '' then
    raise exception 'El método de pago es requerido' using errcode = '22023';
  end if;

  if trim(coalesce(p_reference_number, '')) = '' then
    raise exception 'El número de referencia es requerido' using errcode = '22023';
  end if;

  if trim(coalesce(p_receipt_storage_path, '')) = '' then
    raise exception 'La ruta del comprobante es requerida' using errcode = '22023';
  end if;

  -- 5. Crear suscripción en estado 'pending'
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

  -- 6. Crear pago con el precio oficial, la tasa y el monto en Bs calculados en BD
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

  -- 7. Registrar comprobante
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

revoke execute on function public.submit_manual_payment from public, anon;
grant execute on function public.submit_manual_payment to authenticated;


-- ---------------------------------------------------------------------
-- 5. FUNCIONES ADMINISTRATIVAS: Tasa Manual, Reversión y Aprobación
-- ---------------------------------------------------------------------

-- Función: Fijar tasa manual por el administrador
create or replace function public.admin_set_manual_rate(
  p_rate numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_new_rate_id uuid;
begin
  if not private.is_admin() then
    raise exception 'No autorizado: requiere rol de administrador' using errcode = '42501';
  end if;

  if p_rate is null or p_rate <= 0 then
    raise exception 'La tasa debe ser un número mayor a 0' using errcode = '22023';
  end if;

  -- Desactivar tasa activa anterior
  update public.exchange_rates
  set is_active = false, status = 'superseded'
  where currency_pair = 'USD_VES' and is_active = true;

  -- Insertar y activar la tasa manual
  insert into public.exchange_rates (
    currency_pair,
    rate,
    source,
    source_updated_at,
    created_by,
    is_active,
    status
  )
  values (
    'USD_VES',
    p_rate,
    'manual',
    now(),
    v_admin_id,
    true,
    'active'
  )
  returning id into v_new_rate_id;

  -- Auditoría
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    v_admin_id,
    'exchange_rate.set_manual',
    'exchange_rates',
    v_new_rate_id,
    jsonb_build_object('rate', p_rate, 'source', 'manual')
  );

  return jsonb_build_object('success', true, 'rate_id', v_new_rate_id);
end;
$$;

-- Función: Revertir a la última tasa automática válida de CotizaVE
create or replace function public.admin_revert_to_automated_rate()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_latest_automated record;
begin
  if not private.is_admin() then
    raise exception 'No autorizado: requiere rol de administrador' using errcode = '42501';
  end if;

  -- Buscar la última tasa de cotizave que no haya sido rechazada
  select id, rate into v_latest_automated
  from public.exchange_rates
  where currency_pair = 'USD_VES' and source = 'cotizave' and status in ('active', 'superseded')
  order by source_updated_at desc
  limit 1;

  if not found then
    raise exception 'No existe un histórico de tasas automáticas para restaurar' using errcode = 'P0002';
  end if;

  -- Desactivar cualquier activa actual
  update public.exchange_rates
  set is_active = false
  where currency_pair = 'USD_VES' and is_active = true;

  -- Activar la tasa automática
  update public.exchange_rates
  set is_active = true, status = 'active'
  where id = v_latest_automated.id;

  -- Auditoría
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    v_admin_id,
    'exchange_rate.revert_automated',
    'exchange_rates',
    v_latest_automated.id,
    jsonb_build_object('rate', v_latest_automated.rate)
  );

  return jsonb_build_object('success', true, 'rate_id', v_latest_automated.id);
end;
$$;

-- Función: Revisar tasas retenidas por variación > 15%
create or replace function public.admin_review_pending_rate(
  p_rate_id uuid,
  p_decision text -- 'approved' | 'rejected'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select auth.uid());
  v_pending record;
begin
  if not private.is_admin() then
    raise exception 'No autorizado: requiere rol de administrador' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decisión inválida' using errcode = '22023';
  end if;

  select id, rate into v_pending
  from public.exchange_rates
  where id = p_rate_id and status = 'pending_approval';

  if not found then
    raise exception 'Tasa pendiente no encontrada' using errcode = 'P0002';
  end if;

  if p_decision = 'approved' then
    update public.exchange_rates
    set is_active = false, status = 'superseded'
    where currency_pair = 'USD_VES' and is_active = true;

    update public.exchange_rates
    set is_active = true, status = 'active'
    where id = p_rate_id;
  else
    update public.exchange_rates
    set status = 'rejected'
    where id = p_rate_id;
  end if;

  -- Auditoría
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    v_admin_id,
    'exchange_rate.review_pending',
    'exchange_rates',
    p_rate_id,
    jsonb_build_object('decision', p_decision)
  );

  return jsonb_build_object('success', true);
end;
$$;

revoke execute on function public.admin_set_manual_rate from public, anon;
grant execute on function public.admin_set_manual_rate to authenticated;

revoke execute on function public.admin_revert_to_automated_rate from public, anon;
grant execute on function public.admin_revert_to_automated_rate to authenticated;

revoke execute on function public.admin_review_pending_rate from public, anon;
grant execute on function public.admin_review_pending_rate to authenticated;
