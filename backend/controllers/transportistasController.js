const Transportista = require('../models/Transportista');

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const transportistas = search ? await Transportista.search(search) : await Transportista.findAll();
    res.json({ transportistas });
  } catch (error) {
    console.error('Error al obtener transportistas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getById = async (req, res) => {
  try {
    const transportista = await Transportista.findById(req.params.id);
    if (!transportista) {
      return res.status(404).json({ message: 'Transportista no encontrado' });
    }
    res.json({ transportista });
  } catch (error) {
    console.error('Error al obtener transportista:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombres, apellidos, codigo_identificador, placa, ruta } = req.body;

    if (!nombres || !apellidos || !codigo_identificador) {
      return res.status(400).json({ message: 'Nombres, apellidos y código identificador son obligatorios' });
    }

    const existing = await Transportista.findByCodigo(codigo_identificador);
    if (existing) {
      return res.status(409).json({ message: 'El código identificador ya está registrado' });
    }

    const id = await Transportista.create({ nombres, apellidos, codigo_identificador, placa, ruta });
    const transportista = await Transportista.findById(id);
    res.status(201).json({ message: 'Transportista creado', transportista });
  } catch (error) {
    console.error('Error al crear transportista:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombres, apellidos, codigo_identificador, placa, ruta } = req.body;

    const transportista = await Transportista.findById(req.params.id);
    if (!transportista) {
      return res.status(404).json({ message: 'Transportista no encontrado' });
    }

    if (codigo_identificador && codigo_identificador !== transportista.codigo_identificador) {
      const existing = await Transportista.findByCodigo(codigo_identificador);
      if (existing) {
        return res.status(409).json({ message: 'El código identificador ya está en uso' });
      }
    }

    await Transportista.update(req.params.id, {
      nombres, apellidos, codigo_identificador, placa, ruta
    });

    const updated = await Transportista.findById(req.params.id);
    res.json({ message: 'Transportista actualizado', transportista: updated });
  } catch (error) {
    console.error('Error al actualizar transportista:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.remove = async (req, res) => {
  try {
    const transportista = await Transportista.findById(req.params.id);
    if (!transportista) {
      return res.status(404).json({ message: 'Transportista no encontrado' });
    }

    await Transportista.delete(req.params.id);
    res.json({ message: 'Transportista eliminado' });
  } catch (error) {
    console.error('Error al eliminar transportista:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
