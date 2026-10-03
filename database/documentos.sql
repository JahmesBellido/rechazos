CREATE TABLE documentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_identificador VARCHAR(50) NOT NULL,
  carga VARCHAR(10) DEFAULT NULL,
  liquidacion_programada DECIMAL(10,2) DEFAULT NULL,
  cant_documentos INT DEFAULT NULL,
  fecha_documentos DATE DEFAULT NULL,
  liquidacion_total_diaria DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (codigo_identificador) REFERENCES transportistas(codigo_identificador) ON DELETE CASCADE ON UPDATE CASCADE
);
