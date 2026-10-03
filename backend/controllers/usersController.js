const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const users = search ? await User.search(search) : await User.findAll();
    res.json({ users });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const { fname, lname, email, password, phone, bio, role, avatar, status } = req.body;

    if (!fname || !lname || !email || !password) {
      return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son obligatorios' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({ fname, lname, email, password: hashedPassword, role, avatar, status });

    if (phone || bio) {
      await User.update(userId, { phone, bio });
    }

    const user = await User.findById(userId);
    res.status(201).json({ message: 'Usuario creado', user });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.update = async (req, res) => {
  try {
    const { fname, lname, email, phone, bio, role, avatar, status } = req.body;
    console.log('[UPDATE] Body recibido:', JSON.stringify(req.body, null, 2));

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (email && email !== user.email) {
      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ message: 'El email ya está en uso' });
      }
    }

    await User.update(req.params.id, { fname, lname, email, phone, bio, role, avatar, status });
    console.log('[UPDATE] Status enviado:', status);

    const updated = await User.findById(req.params.id);
    res.json({ message: 'Usuario actualizado', user: updated });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.role === 'admin') {
      const admins = (await User.findAll()).filter(u => u.role === 'admin');
      if (admins.length <= 1) {
        return res.status(400).json({ message: 'No se puede desactivar el último administrador' });
      }
    }

    const newStatus = user.status === 'activo' ? 'inactivo' : 'activo';
    await User.update(req.params.id, { status: newStatus });

    const updated = await User.findById(req.params.id);
    res.json({ message: `Usuario ${newStatus}`, user: updated });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (user.role === 'admin') {
      const admins = (await User.findAll()).filter(u => u.role === 'admin');
      if (admins.length <= 1) {
        return res.status(400).json({ message: 'No se puede eliminar el último administrador' });
      }
    }

    await User.delete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
