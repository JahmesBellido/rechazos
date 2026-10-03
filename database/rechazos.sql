CREATE TABLE rechazos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_identificador VARCHAR(50) NOT NULL,
  cantidad_rechazada DECIMAL(10,2) DEFAULT 0,
  total_rechazo DECIMAL(10,2) DEFAULT 0,
  cant_totalrechazados INT DEFAULT 0,
  fecha_rechazo DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (codigo_identificador) REFERENCES transportistas(codigo_identificador) ON DELETE CASCADE ON UPDATE CASCADE
);
