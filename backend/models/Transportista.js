const pool = require('../config/db');

class Transportista {
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT id, nombres, apellidos, codigo_identificador, placa, ruta, created_at, updated_at
       FROM transportistas WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByCodigo(codigo_identificador) {
    const [rows] = await pool.query(
      'SELECT id, nombres, apellidos, codigo_identificador, placa, ruta FROM transportistas WHERE codigo_identificador = ?',
      [codigo_identificador]
    );
    return rows[0] || null;
  }

  static async create({ nombres, apellidos, codigo_identificador, placa = null, ruta = null }) {
    const [result] = await pool.query(
      'INSERT INTO transportistas (nombres, apellidos, codigo_identificador, placa, ruta) VALUES (?, ?, ?, ?, ?)',
      [nombres, apellidos, codigo_identificador, placa, ruta]
    );
    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    const allowed = ['nombres', 'apellidos', 'codigo_identificador', 'placa', 'ruta'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.query(`UPDATE transportistas SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async delete(id) {
    await pool.query('DELETE FROM transportistas WHERE id = ?', [id]);
  }

  static async findAll() {
    const [rows] = await pool.query(
      `SELECT id, nombres, apellidos, codigo_identificador, placa, ruta, created_at, updated_at
       FROM transportistas ORDER BY created_at DESC`
    );
    return rows;
  }

  static async search(query) {
    const [rows] = await pool.query(
      `SELECT id, nombres, apellidos, codigo_identificador, placa, ruta, created_at, updated_at
       FROM transportistas
       WHERE nombres LIKE ? OR apellidos LIKE ? OR codigo_identificador LIKE ? OR ruta LIKE ?
       ORDER BY created_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );
    return rows;
  }
}

module.exports = Transportista;
