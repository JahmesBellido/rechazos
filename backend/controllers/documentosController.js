const Documento = require('../models/Documento');

exports.getAll = async (req, res) => {
  try {
    const { search, fecha } = req.query;
    const Documento = require('../models/Documento');
    let documentos;
    if (search) {
      documentos = await Documento.search(search);
    } else {
      documentos = await Documento.findAll();
    }
    if (fecha) {
      documentos = documentos.filter(d => {
        if (!d.fecha_documentos) return false;
        const f = d.fecha_documentos.split("T")[0];
        return f === fecha;
      });
    }
    res.json({ documentos });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getById = async (req, res) => {
  try {
    const documento = await Documento.findById(req.params.id);
    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    res.json({ documento });
  } catch (error) {
    console.error('Error al obtener documento:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.create = async (req, res) => {
  try {
    const { codigo_identificador, carga, liquidacion_programada, cant_documentos, cargas_programadas, unidades_programadas, fecha_documentos } = req.body;

    if (!codigo_identificador) {
      return res.status(400).json({ message: 'El código identificador es obligatorio' });
    }

    const id = await Documento.create({ codigo_identificador, carga, liquidacion_programada, cant_documentos, cargas_programadas, unidades_programadas, fecha_documentos });
    const documento = await Documento.findById(id);
    res.status(201).json({ message: 'Documento creado', documento });
  } catch (error) {
    console.error('Error al crear documento:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.update = async (req, res) => {
  try {
    const { codigo_identificador, carga, liquidacion_programada, cant_documentos, cargas_programadas, unidades_programadas, fecha_documentos } = req.body;

    const documento = await Documento.findById(req.params.id);
    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    await Documento.update(req.params.id, {
      codigo_identificador, carga, liquidacion_programada, cant_documentos, cargas_programadas, unidades_programadas, fecha_documentos
    });

    const updated = await Documento.findById(req.params.id);
    res.json({ message: 'Documento actualizado', documento: updated });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.remove = async (req, res) => {
  try {
    const documento = await Documento.findById(req.params.id);
    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    await Documento.delete(req.params.id);
    res.json({ message: 'Documento eliminado' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
