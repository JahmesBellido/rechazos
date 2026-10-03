-- Agregar campo status y actualizar avatar por defecto
ALTER TABLE users 
  ADD COLUMN status ENUM('activo','inactivo') DEFAULT 'activo' AFTER role;

-- Actualizar el admin existente con status activo
UPDATE users SET status = 'activo' WHERE email = 'admin@rechazos.com';

-- Quitar avatar por defecto a todos los usuarios
UPDATE users SET avatar = NULL WHERE avatar = '/images/user/owner.jpg';
