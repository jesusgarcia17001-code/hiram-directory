-- =====================================================================
-- FASE 7, PASO 2: Auditoría para Gestión de Ubicaciones
-- =====================================================================

-- Conectar el trigger audit_changes a las tablas de ubicaciones para
-- registrar cualquier inserción, actualización de nombre o cambio de estado.
create trigger audit_states
  after insert or update on public.states
  for each row execute function private.audit_changes();

create trigger audit_municipalities
  after insert or update on public.municipalities
  for each row execute function private.audit_changes();

create trigger audit_localities
  after insert or update on public.localities
  for each row execute function private.audit_changes();
