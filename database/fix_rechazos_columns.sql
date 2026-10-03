-- Corregir inconsistencia de columnas en rechazos
-- La tabla original tiene cant_totalrechazados, el modelo usa cant_documentos_rechazados

-- Si existe cant_totalrechazados, renombrarla a cant_documentos_rechazados
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rechazos' AND COLUMN_NAME = 'cant_totalrechazados');
SET @sql = IF(@exists > 0, 'ALTER TABLE rechazos CHANGE COLUMN cant_totalrechazados cant_documentos_rechazados INT DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Si existe cant_documentos (de migración anterior), eliminarla si cant_documentos_rechazados ya existe
SET @exists_doc = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rechazos' AND COLUMN_NAME = 'cant_documentos');
SET @exists_rech = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rechazos' AND COLUMN_NAME = 'cant_documentos_rechazados');
SET @sql2 = IF(@exists_doc > 0 AND @exists_rech > 0, 'ALTER TABLE rechazos DROP COLUMN cant_documentos', 'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Si no existe ninguno de los dos, agregar cant_documentos_rechazados
SET @none_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rechazos' AND COLUMN_NAME IN ('cant_totalrechazados', 'cant_documentos_rechazados'));
SET @sql3 = IF(@none_exists = 0, 'ALTER TABLE rechazos ADD COLUMN cant_documentos_rechazados INT DEFAULT 0 AFTER total_rechazo', 'SELECT 1');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Agregar documentos_finales y liquidacion_final si no existen
SET @exists_df = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rechazos' AND COLUMN_NAME = 'documentos_finales');
SET @sql4 = IF(@exists_df = 0, 'ALTER TABLE rechazos ADD COLUMN documentos_finales INT DEFAULT 0 AFTER cant_documentos_rechazados', 'SELECT 1');
PREPARE stmt4 FROM @sql4;
EXECUTE stmt4;
DEALLOCATE PREPARE stmt4;

SET @exists_lf = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rechazos' AND COLUMN_NAME = 'liquidacion_final');
SET @sql5 = IF(@exists_lf = 0, 'ALTER TABLE rechazos ADD COLUMN liquidacion_final DECIMAL(10,2) DEFAULT 0 AFTER documentos_finales', 'SELECT 1');
PREPARE stmt5 FROM @sql5;
EXECUTE stmt5;
DEALLOCATE PREPARE stmt5;
