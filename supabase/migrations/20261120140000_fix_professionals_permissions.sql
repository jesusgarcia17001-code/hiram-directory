-- =====================================================================
-- Corrección de Permisos de Inserción en Tabla Professionals
-- =====================================================================

-- 1. Permitir que authenticated pueda insertar columnas necesarias
grant insert (status) on public.professionals to authenticated;

-- 2. Asegurar que las columnas de tipo de prestador y documento tengan permisos
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'professionals'
      and column_name = 'provider_type'
  ) then
    execute 'grant insert (provider_type, id_type, id_number) on public.professionals to authenticated;';
    execute 'grant update (provider_type, id_type, id_number) on public.professionals to authenticated;';
  end if;
end $$;
