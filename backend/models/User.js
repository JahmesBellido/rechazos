const pool = require('../config/db');

class User {
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, fname, lname, email, phone, bio, avatar, role, status, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async create({ fname, lname, email, password, role = 'user', avatar = null, status = 'activo' }) {
    const [result] = await pool.query(
      'INSERT INTO users (fname, lname, email, password, role, avatar, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fname, lname, email, password, role, avatar, status]
    );
    return result.insertId;
  }

  static async update(id, { fname, lname, email, phone, bio, avatar, role, status }) {
    const fields = [];
    const values = [];

    if (fname !== undefined) { fields.push('fname = ?'); values.push(fname); }
    if (lname !== undefined) { fields.push('lname = ?'); values.push(lname); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }
    if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) return false;

    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  }

  static async updatePassword(id, password) {
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [password, id]);
  }

  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  }

  static async findAll() {
    const [rows] = await pool.query(
      'SELECT id, fname, lname, email, phone, bio, avatar, role, status, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  }

  static async search(query) {
    const [rows] = await pool.query(
      `SELECT id, fname, lname, email, phone, bio, avatar, role, status, created_at, updated_at 
       FROM users 
       WHERE fname LIKE ? OR lname LIKE ? OR email LIKE ? 
       ORDER BY created_at DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    return rows;
  }
}

module.exports = User;
