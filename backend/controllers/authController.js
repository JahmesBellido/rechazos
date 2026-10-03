const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.signup = async (req, res) => {
  try {
    const { fname, lname, email, password } = req.body;

    if (!fname || !lname || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({ fname, lname, email, password: hashedPassword });

    const user = await User.findById(userId);
    req.session.user = user;

    res.status(201).json({ message: 'Usuario creado', user });
  } catch (error) {
    console.error('Error en signup:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log('[LOGIN] Usuario:', user.email, '| Status:', user.status);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (user.status === 'inactivo') {
      console.log('[LOGIN] Bloqueado - usuario inactivo:', user.email);
      return res.status(403).json({ message: 'Tu cuenta está desactivada. Contacta al administrador.' });
    }

    console.log('[LOGIN] Login exitoso:', user.email);

    const { password: _, ...userWithoutPassword } = user;
    req.session.user = userWithoutPassword;

    res.json({ message: 'Inicio de sesión exitoso', user: userWithoutPassword });
  } catch (error) {
    console.error('Error en signin:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.signout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesión cerrada' });
  });
};

exports.me = (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  res.json({ user: req.session.user });
};
