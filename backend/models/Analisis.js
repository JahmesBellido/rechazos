const pool = require('../config/db');

class Analisis {
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM analisis WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM analisis ORDER BY fecha_analisis DESC, id DESC');
    return rows;
  }

  static async search(query) {
    const [rows] = await pool.query(
      `SELECT * FROM analisis
       WHERE motivo_anulacion LIKE ? OR fecha_analisis LIKE ?
       ORDER BY fecha_analisis DESC, id DESC`,
      [`%${query}%`, `%${query}%`]
    );
    return rows;
  }

  static async create({ motivo_anulacion, importe = 0, cant_analisis = 0, fecha_analisis, cajas_motivo = 0, unidades_motivo = 0, cantidad_motivo = 0 }) {
    const [result] = await pool.query(
      `INSERT INTO analisis (motivo_anulacion, importe, cant_analisis, fecha_analisis, cajas_motivo, unidades_motivo, cantidad_motivo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [motivo_anulacion, importe, cant_analisis, fecha_analisis, cajas_motivo, unidades_motivo, cantidad_motivo]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['motivo_anulacion', 'importe', 'cant_analisis', 'fecha_analisis', 'cajas_motivo', 'unidades_motivo', 'cantidad_motivo'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.query(`UPDATE analisis SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await pool.query('DELETE FROM analisis WHERE id = ?', [id]);
  }
}

module.exports = Analisis;
