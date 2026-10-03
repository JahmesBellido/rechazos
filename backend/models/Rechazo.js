const pool = require('../config/db');

class Rechazo {
  static async syncCantTotal(codigo_identificador, fecha_rechazo) {
    if (!codigo_identificador || !fecha_rechazo) return;
    await pool.query(
      `UPDATE rechazos r
       INNER JOIN (
         SELECT COALESCE(SUM(cant_documentos), 0) AS total_docs
         FROM documentos
         WHERE codigo_identificador = ?
           AND fecha_documentos = ?
       ) d ON 1=1
       SET r.documentos_finales = d.total_docs - r.cant_documentos_rechazados
       WHERE r.codigo_identificador = ?
         AND r.fecha_rechazo = ?`,
      [codigo_identificador, fecha_rechazo, codigo_identificador, fecha_rechazo]
    );
  }

  static async syncLiquidacionFinal(codigo_identificador, fecha_rechazo) {
    if (!codigo_identificador || !fecha_rechazo) return;
    await pool.query(
      `UPDATE rechazos r
       INNER JOIN (
         SELECT COALESCE(SUM(liquidacion_total_diaria), 0) AS total_liq
         FROM documentos
         WHERE codigo_identificador = ?
           AND fecha_documentos = ?
       ) d ON 1=1
       SET r.liquidacion_final = d.total_liq - r.total_rechazo
       WHERE r.codigo_identificador = ?
         AND r.fecha_rechazo = ?`,
      [codigo_identificador, fecha_rechazo, codigo_identificador, fecha_rechazo]
    );
  }

  static async syncCajasFinal(codigo_identificador, fecha_rechazo) {
    if (!codigo_identificador || !fecha_rechazo) return;
    await pool.query(
      `UPDATE rechazos r
       INNER JOIN (
         SELECT COALESCE(SUM(cargas_programadas), 0) AS total_cargas
         FROM documentos
         WHERE codigo_identificador = ?
           AND fecha_documentos = ?
       ) d ON 1=1
       SET r.cajas_final = d.total_cargas - r.cajas_fisicas
       WHERE r.codigo_identificador = ?
         AND r.fecha_rechazo = ?`,
      [codigo_identificador, fecha_rechazo, codigo_identificador, fecha_rechazo]
    );
  }

  static async getDocTotales(codigo_identificador, fecha_rechazo) {
    if (!codigo_identificador || !fecha_rechazo) return 0;
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(cant_documentos), 0) AS total
       FROM documentos
       WHERE codigo_identificador = ?
         AND fecha_documentos = ?`,
      [codigo_identificador, fecha_rechazo]
    );
    return rows[0].total;
  }

  static async getLiqTotales(codigo_identificador, fecha_rechazo) {
    if (!codigo_identificador || !fecha_rechazo) return 0;
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(liquidacion_total_diaria), 0) AS total
       FROM documentos
       WHERE codigo_identificador = ?
         AND fecha_documentos = ?`,
      [codigo_identificador, fecha_rechazo]
    );
    return rows[0].total;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.id, r.codigo_identificador, r.cantidad_rechazada, r.total_rechazo,
              r.cant_documentos_rechazados, r.cajas_fisicas, r.unidades_fisicas,
              r.cajas_final,
              r.documentos_finales, r.liquidacion_final, r.fecha_rechazo,
              r.created_at, r.updated_at,
              t.nombres, t.apellidos, t.placa, t.ruta
       FROM rechazos r
       LEFT JOIN transportistas t ON r.codigo_identificador = t.codigo_identificador
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async create({ codigo_identificador, cantidad_rechazada = 0, cant_documentos_rechazados = 0, cajas_fisicas = 0, unidades_fisicas = 0, fecha_rechazo = null }) {
    const total_rechazo = Number(cantidad_rechazada) * 1.02;
    const docTotales = await Rechazo.getDocTotales(codigo_identificador, fecha_rechazo);
    const documentos_finales = docTotales - Number(cant_documentos_rechazados);
    const liqTotales = await Rechazo.getLiqTotales(codigo_identificador, fecha_rechazo);
    const liquidacion_final = liqTotales - total_rechazo;

    const [progRow] = await pool.query(
      `SELECT COALESCE(SUM(cargas_programadas), 0) AS total_cargas
       FROM documentos
       WHERE codigo_identificador = ?
         AND fecha_documentos = ?`,
      [codigo_identificador, fecha_rechazo]
    );
    const cajas_final = Number(progRow[0].total_cargas) - Number(cajas_fisicas);

    const [result] = await pool.query(
      'INSERT INTO rechazos (codigo_identificador, cantidad_rechazada, total_rechazo, cant_documentos_rechazados, cajas_fisicas, unidades_fisicas, cajas_final, documentos_finales, liquidacion_final, fecha_rechazo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [codigo_identificador, cantidad_rechazada, total_rechazo, cant_documentos_rechazados, cajas_fisicas, unidades_fisicas, cajas_final, documentos_finales, liquidacion_final, fecha_rechazo]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const rechazoActual = await Rechazo.findById(id);

    const fields = [];
    const values = [];
    const allowed = ['codigo_identificador', 'cantidad_rechazada', 'cant_documentos_rechazados', 'cajas_fisicas', 'unidades_fisicas', 'fecha_rechazo'];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }

    const needRecalcTotal = data.cantidad_rechazada !== undefined || data.cant_documentos_rechazados !== undefined;
    const needRecalcFinal = needRecalcTotal || data.cajas_fisicas !== undefined || data.unidades_fisicas !== undefined;

    if (needRecalcTotal || needRecalcFinal) {
      var codigo = data.codigo_identificador || rechazoActual.codigo_identificador;
      var fecha = data.fecha_rechazo || rechazoActual.fecha_rechazo;
    }

    if (needRecalcTotal) {
      const cantRechazada = data.cantidad_rechazada !== undefined ? Number(data.cantidad_rechazada) : Number(rechazoActual.cantidad_rechazada);
      const cantRechazados = data.cant_documentos_rechazados !== undefined ? Number(data.cant_documentos_rechazados) : Number(rechazoActual.cant_documentos_rechazados);
      const docTotales = await Rechazo.getDocTotales(codigo, fecha);
      const liqTotales = await Rechazo.getLiqTotales(codigo, fecha);
      const newTotalRechazo = cantRechazada * 1.02;
      fields.push('total_rechazo = ?');
      values.push(newTotalRechazo);
      fields.push('documentos_finales = ?');
      values.push(docTotales - cantRechazados);
      fields.push('liquidacion_final = ?');
      values.push(liqTotales - newTotalRechazo);
    }

    if (needRecalcFinal) {
      const cajasFisicas = data.cajas_fisicas !== undefined ? Number(data.cajas_fisicas) : Number(rechazoActual.cajas_fisicas);
      const [progRow] = await pool.query(
        `SELECT COALESCE(SUM(cargas_programadas), 0) AS total_cargas
         FROM documentos
         WHERE codigo_identificador = ?
           AND fecha_documentos = ?`,
        [codigo, fecha]
      );
      fields.push('cajas_final = ?');
      values.push(Number(progRow[0].total_cargas) - cajasFisicas);
    }

    if (fields.length === 0) return false;
    values.push(id);
    await pool.query(`UPDATE rechazos SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await pool.query('DELETE FROM rechazos WHERE id = ?', [id]);
  }

  static async findAll() {
    const [rows] = await pool.query(
      `SELECT r.id, r.codigo_identificador, r.cantidad_rechazada, r.total_rechazo,
              r.cant_documentos_rechazados, r.cajas_fisicas, r.unidades_fisicas,
              r.cajas_final,
              r.documentos_finales, r.liquidacion_final, r.fecha_rechazo,
              r.created_at, r.updated_at,
              t.nombres, t.apellidos, t.placa, t.ruta
       FROM rechazos r
       LEFT JOIN transportistas t ON r.codigo_identificador = t.codigo_identificador
       ORDER BY r.fecha_rechazo DESC`
    );
    return rows;
  }

  static async search(query) {
    const [rows] = await pool.query(
      `SELECT r.id, r.codigo_identificador, r.cantidad_rechazada, r.total_rechazo,
              r.cant_documentos_rechazados, r.cajas_fisicas, r.unidades_fisicas,
              r.cajas_final,
              r.documentos_finales, r.liquidacion_final, r.fecha_rechazo,
              r.created_at, r.updated_at,
              t.nombres, t.apellidos, t.placa, t.ruta
       FROM rechazos r
       LEFT JOIN transportistas t ON r.codigo_identificador = t.codigo_identificador
       WHERE r.codigo_identificador LIKE ? OR t.nombres LIKE ? OR t.apellidos LIKE ?
       ORDER BY r.fecha_rechazo DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    return rows;
  }
}

module.exports = Rechazo;
