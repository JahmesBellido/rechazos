ALTER TABLE analisis
  ADD COLUMN cajas_motivo INT DEFAULT 0 AFTER cant_analisis,
  ADD COLUMN unidades_motivo INT DEFAULT 0 AFTER cajas_motivo,
  ADD COLUMN cantidad_motivo INT DEFAULT 0 AFTER unidades_motivo,
  ADD COLUMN cod_cliente VARCHAR(50) DEFAULT NULL AFTER cantidad_motivo,
  ADD COLUMN razon_social VARCHAR(255) DEFAULT NULL AFTER cod_cliente;
