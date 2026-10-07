ALTER TABLE analisis
  ADD COLUMN cajas_motivo INT DEFAULT 0 AFTER cant_analisis,
  ADD COLUMN unidades_motivo INT DEFAULT 0 AFTER cajas_motivo,
  ADD COLUMN cantidad_motivo INT DEFAULT 0 AFTER unidades_motivo;
