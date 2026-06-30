const { pool } = require('../config/db');

exports.getCustomerByPhone = async (req, res) => {
  const { phone } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM customers WHERE phone = ?', [phone]);
    if (rows.length === 0) return res.status(404).json({ message: 'Customer not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers ORDER BY created_at DESC';
    let params = [];

    if (search) {
      query = `SELECT * FROM customers 
        WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ?
        ORDER BY created_at DESC`;
      const term = `%${search}%`;
      params = [term, term, term];
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomerStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM customers');
    const [[{ thisWeek }]] = await pool.query(
      `SELECT COUNT(*) AS thisWeek FROM customers 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    const [[{ returning }]] = await pool.query(
      `SELECT COUNT(DISTINCT c.id) AS returning FROM customers c
       INNER JOIN reservations r ON r.guest_phone = c.phone
       WHERE r.status = 'Completed'`
    );

    res.json({
      totalGuests: total,
      newThisWeek: thisWeek,
      returningGuests: returning,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  const {
    full_name,
    email,
    phone,
    id_proof,
    address,
    room_no,
    room_type,
    loyalty_status,
  } = req.body;

  if (!full_name || !phone) {
    return res.status(400).json({ message: 'Full name and phone are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO customers (full_name, email, phone, id_proof, address, room_no, room_type, loyalty_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email || null,
        phone,
        id_proof || null,
        address || null,
        room_no || null,
        room_type || null,
        loyalty_status || 'New',
      ]
    );

    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const {
    full_name,
    email,
    phone,
    id_proof,
    address,
    room_no,
    room_type,
    loyalty_status,
  } = req.body;

  try {
    await pool.query(
      `UPDATE customers SET full_name=?, email=?, phone=?, id_proof=?, address=?, room_no=?, room_type=?, loyalty_status=?
       WHERE id=?`,
      [full_name, email, phone, id_proof, address, room_no, room_type, loyalty_status, id]
    );
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    res.json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
