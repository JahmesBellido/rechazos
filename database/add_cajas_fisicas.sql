ALTER TABLE rechazos
  ADD COLUMN cajas_fisicas INT DEFAULT 0 AFTER cant_documentos_rechazados,
  ADD COLUMN unidades_fisicas INT DEFAULT 0 AFTER cajas_fisicas;
