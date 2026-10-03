-- Agregar campo liquidacion_total_diaria a documentos
ALTER TABLE documentos ADD COLUMN liquidacion_total_diaria DECIMAL(10,2) DEFAULT 0 AFTER fecha_documentos;

-- Actualizar los valores existentes: sumar liquidacion_programada por transportista y fecha
UPDATE documentos d1
INNER JOIN (
  SELECT codigo_identificador, fecha_documentos, SUM(liquidacion_programada) AS total
  FROM documentos
  GROUP BY codigo_identificador, fecha_documentos
) d2 ON d1.codigo_identificador = d2.codigo_identificador
   AND d1.fecha_documentos = d2.fecha_documentos
SET d1.liquidacion_total_diaria = d2.total;
