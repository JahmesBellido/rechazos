const Analisis = require('../models/Analisis');

exports.getAll = async (req, res) => {
  try {
    const { search, fecha } = req.query;
    let items;
    if (search) {
      items = await Analisis.search(search);
    } else {
      items = await Analisis.findAll();
    }
    if (fecha) {
      items = items.filter(item => {
        const f = String(item.fecha_analisis).split('T')[0];
        return f === fecha;
      });
    }
    res.json({ analisis: items });
  } catch (error) {
    console.error('Error al obtener analisis:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await Analisis.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Registro no encontrado' });
    res.json({ analisis: item });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const { motivo_anulacion, importe, cant_analisis, fecha_analisis, cajas_motivo, unidades_motivo, cantidad_motivo } = req.body;
    if (!motivo_anulacion) return res.status(400).json({ message: 'El motivo de anulacion es obligatorio' });
    if (!fecha_analisis) return res.status(400).json({ message: 'La fecha es obligatoria' });
    const id = await Analisis.create({ motivo_anulacion, importe, cant_analisis, fecha_analisis, cajas_motivo, unidades_motivo, cantidad_motivo });
    const item = await Analisis.findById(id);
    res.status(201).json({ message: 'Registro creado', analisis: item });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Analisis.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Registro no encontrado' });
    await Analisis.update(req.params.id, req.body);
    const updated = await Analisis.findById(req.params.id);
    res.json({ message: 'Registro actualizado', analisis: updated });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Analisis.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Registro no encontrado' });
    await Analisis.delete(req.params.id);
    res.json({ message: 'Registro eliminado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
