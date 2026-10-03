ALTER TABLE documentos
  ADD COLUMN cargas_programadas INT DEFAULT NULL AFTER cant_documentos,
  ADD COLUMN unidades_programadas INT DEFAULT NULL AFTER cargas_programadas;
