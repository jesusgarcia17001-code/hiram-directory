-- Migración: Índice único condicional para documentos de identidad (cédula / RIF)
-- Evita que dos perfiles profesionales utilicen el mismo tipo y número de documento.
-- Es condicional (where id_type is not null and id_number is not null) para permitir
-- registros que aún no tengan documento completado, pero forzar unicidad estricta para cualquier par no nulo.

create unique index if not exists professionals_id_document_unique_idx
  on public.professionals (id_type, id_number)
  where id_type is not null and id_number is not null;
