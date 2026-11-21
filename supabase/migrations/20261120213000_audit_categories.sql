-- =====================================================================
-- FASE 7: Auditoría para Gestión de Categorías
-- =====================================================================

-- Conectar el trigger audit_changes a la tabla categories para registrar
-- cualquier inserción, actualización o cambio de estado administrativo.
create trigger audit_categories
  after insert or update on public.categories
  for each row execute function private.audit_changes();
