CREATE DATABASE IF NOT EXISTS rechazos;
USE rechazos;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fname VARCHAR(100) NOT NULL,
  lname VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(191) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  avatar VARCHAR(255) DEFAULT NULL,
  role ENUM('admin','user') DEFAULT 'user',
  status ENUM('activo','inactivo') DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar admin por defecto (password: admin123)
INSERT INTO users (fname, lname, email, password, role, status) VALUES
('Admin', 'Sistema', 'admin@rechazos.com', '$2b$10$z4CLaAECVXf2ilS523lblO9ojH22pn1ZujnMfbbrCJfobtFAsn2ey', 'admin', 'activo');
