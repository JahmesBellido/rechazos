const Rechazo = require('../models/Rechazo');

exports.getAll = async (req, res) => {
  try {
    const { search, fecha } = req.query;
    let rechazos;
    if (search) {
      rechazos = await Rechazo.search(search);
    } else {
      rechazos = await Rechazo.findAll();
    }
    if (fecha) {
      rechazos = rechazos.filter(r => {
        if (!r.fecha_rechazo) return false;
        const f = String(r.fecha_rechazo).split("T")[0];
        return f === fecha;
      });
    }
    res.json({ rechazos });
  } catch (error) {
    console.error('Error al obtener rechazos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getById = async (req, res) => {
  try {
    const rechazo = await Rechazo.findById(req.params.id);
    if (!rechazo) {
      return res.status(404).json({ message: 'Rechazo no encontrado' });
    }
    res.json({ rechazo });
  } catch (error) {
    console.error('Error al obtener rechazo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const { codigo_identificador, cantidad_rechazada, cant_documentos_rechazados, cajas_fisicas, unidades_fisicas, fecha_rechazo } = req.body;

    if (!codigo_identificador) {
      return res.status(400).json({ message: 'El código identificador es obligatorio' });
    }

    const id = await Rechazo.create({ codigo_identificador, cantidad_rechazada, cant_documentos_rechazados, cajas_fisicas, unidades_fisicas, fecha_rechazo });
    const rechazo = await Rechazo.findById(id);
    res.status(201).json({ message: 'Rechazo creado', rechazo });
  } catch (error) {
    console.error('Error al crear rechazo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.update = async (req, res) => {
  try {
    const { codigo_identificador, cantidad_rechazada, cant_documentos_rechazados, cajas_fisicas, unidades_fisicas, fecha_rechazo } = req.body;

    const rechazo = await Rechazo.findById(req.params.id);
    if (!rechazo) {
      return res.status(404).json({ message: 'Rechazo no encontrado' });
    }

    await Rechazo.update(req.params.id, {
      codigo_identificador, cantidad_rechazada, cant_documentos_rechazados, cajas_fisicas, unidades_fisicas, fecha_rechazo
    });

    const updated = await Rechazo.findById(req.params.id);
    res.json({ message: 'Rechazo actualizado', rechazo: updated });
  } catch (error) {
    console.error('Error al actualizar rechazo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.remove = async (req, res) => {
  try {
    const rechazo = await Rechazo.findById(req.params.id);
    if (!rechazo) {
      return res.status(404).json({ message: 'Rechazo no encontrado' });
    }

    await Rechazo.delete(req.params.id);
    res.json({ message: 'Rechazo eliminado' });
  } catch (error) {
    console.error('Error al eliminar rechazo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
