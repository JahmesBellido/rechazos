const pool = require('../config/db');

class Documento {
  static async syncLiquidacionTotal(codigo_identificador, fecha_documentos) {
    if (!codigo_identificador || !fecha_documentos) return;
    await pool.query(
      `UPDATE documentos d1
       INNER JOIN (
         SELECT codigo_identificador AS cod, fecha_documentos AS fec,
                COALESCE(SUM(liquidacion_programada), 0) AS total
         FROM documentos
         WHERE codigo_identificador = ?
           AND fecha_documentos = ?
         GROUP BY codigo_identificador, fecha_documentos
       ) d2 ON d1.codigo_identificador = d2.cod AND d1.fecha_documentos = d2.fec
       SET d1.liquidacion_total_diaria = d2.total`,
      [codigo_identificador, fecha_documentos]
    );
  }

  static async syncRechazos(codigo_identificador, fecha) {
    if (!codigo_identificador || !fecha) return;
    await pool.query(
      `UPDATE rechazos r
       INNER JOIN (
         SELECT COALESCE(SUM(cant_documentos), 0) AS total_docs,
                COALESCE(SUM(liquidacion_total_diaria), 0) AS total_liq,
                COALESCE(SUM(cargas_programadas), 0) AS total_cargas
         FROM documentos
         WHERE codigo_identificador = ?
           AND fecha_documentos = ?
       ) d ON 1=1
       SET r.documentos_finales = d.total_docs - r.cant_documentos_rechazados,
           r.liquidacion_final = d.total_liq - r.total_rechazo,
           r.cajas_final = d.total_cargas - r.cajas_fisicas
       WHERE r.codigo_identificador = ?
         AND r.fecha_rechazo = ?`,
      [codigo_identificador, fecha, codigo_identificador, fecha]
    );
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT d.id, d.codigo_identificador, d.carga, d.liquidacion_programada, d.cant_documentos,
              d.cargas_programadas, d.unidades_programadas,
              d.fecha_documentos, d.liquidacion_total_diaria,
              d.created_at, d.updated_at,
              t.nombres, t.apellidos, t.placa, t.ruta
       FROM documentos d
       LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
       WHERE d.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ codigo_identificador, carga = null, liquidacion_programada = null, cant_documentos = null, cargas_programadas = null, unidades_programadas = null, fecha_documentos = null }) {
    const [result] = await pool.query(
      'INSERT INTO documentos (codigo_identificador, carga, liquidacion_programada, cant_documentos, cargas_programadas, unidades_programadas, fecha_documentos) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [codigo_identificador, carga, liquidacion_programada, cant_documentos, cargas_programadas, unidades_programadas, fecha_documentos]
    );
    await Documento.syncLiquidacionTotal(codigo_identificador, fecha_documentos);
    await Documento.syncRechazos(codigo_identificador, fecha_documentos);
    return result.insertId;
  }

  static async update(id, data) {
    const doc = await Documento.findById(id);

    const fields = [];
    const values = [];
    const allowed = ['codigo_identificador', 'carga', 'liquidacion_programada', 'cant_documentos', 'cargas_programadas', 'unidades_programadas', 'fecha_documentos'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.query(`UPDATE documentos SET ${fields.join(', ')} WHERE id = ?`, values);

    if (doc) {
      await Documento.syncLiquidacionTotal(doc.codigo_identificador, doc.fecha_documentos);
      await Documento.syncRechazos(doc.codigo_identificador, doc.fecha_documentos);
      const newCodigo = data.codigo_identificador || doc.codigo_identificador;
      const newFecha = data.fecha_documentos || doc.fecha_documentos;
      if (newCodigo !== doc.codigo_identificador || newFecha !== doc.fecha_documentos) {
        await Documento.syncLiquidacionTotal(newCodigo, newFecha);
        await Documento.syncRechazos(newCodigo, newFecha);
      }
    }
    return true;
  }

  static async delete(id) {
    const doc = await Documento.findById(id);
    await pool.query('DELETE FROM documentos WHERE id = ?', [id]);
    if (doc) {
      await Documento.syncLiquidacionTotal(doc.codigo_identificador, doc.fecha_documentos);
      await Documento.syncRechazos(doc.codigo_identificador, doc.fecha_documentos);
    }
  }

  static async findAll() {
    const [rows] = await pool.query(
      `SELECT d.id, d.codigo_identificador, d.carga, d.liquidacion_programada, d.cant_documentos,
              d.cargas_programadas, d.unidades_programadas,
              d.fecha_documentos, d.liquidacion_total_diaria,
              d.created_at, d.updated_at,
              t.nombres, t.apellidos, t.placa, t.ruta
       FROM documentos d
       LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
       ORDER BY d.codigo_identificador DESC`
    );
    return rows;
  }

  static async search(query) {
    const [rows] = await pool.query(
      `SELECT d.id, d.codigo_identificador, d.carga, d.liquidacion_programada, d.cant_documentos,
              d.cargas_programadas, d.unidades_programadas,
              d.fecha_documentos, d.liquidacion_total_diaria,
              d.created_at, d.updated_at,
              t.nombres, t.apellidos, t.placa, t.ruta
       FROM documentos d
       LEFT JOIN transportistas t ON d.codigo_identificador = t.codigo_identificador
       WHERE d.codigo_identificador LIKE ? OR t.nombres LIKE ? OR t.apellidos LIKE ?
       ORDER BY d.codigo_identificador DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    return rows;
  }
}

module.exports = Documento;
