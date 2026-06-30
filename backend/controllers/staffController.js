const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getStaff = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, role, phone, status, created_at FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStaffStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users WHERE status = 'active'`
    );
    const [[{ adminCount }]] = await pool.query(
      `SELECT COUNT(*) AS adminCount FROM users WHERE role = 'admin'`
    );
    res.json({
      totalStaff: total,
      adminCount,
      activeCount: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  const { full_name, email, password, role, phone } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const dbRole = role === 'admin' || role === 'Admin' ? 'admin' : 'staff';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, dbRole, phone || null]
    );

    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, phone, status, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { full_name, role, phone, status, password } = req.body;

  try {
    // Check if requester is admin if trying to change status or role or password
    if (req.user.role !== 'admin' && (status || role || password)) {
      return res.status(403).json({ message: 'Only admins can change role, status or password' });
    }

    let query = 'UPDATE users SET full_name = ?, phone = ?';
    let params = [full_name, phone];

    if (req.user.role === 'admin') {
      if (role) { query += ', role = ?'; params.push(role); }
      if (status) { query += ', status = ?'; params.push(status); }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ', password = ?';
        params.push(hashedPassword);
      }
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.query(query, params);
    res.json({ message: 'Staff updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can delete staff' });
  }
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
