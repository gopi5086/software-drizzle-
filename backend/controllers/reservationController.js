const { pool } = require('../config/db');
const emailService = require('../utils/emailService');

exports.getReservations = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reservations ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReservationById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reservation not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReservation = async (req, res) => {
  const { 
    guest_name, guest_email, guest_phone, check_in, check_out, 
    adults, children, room_type, num_rooms, room_details, 
    special_requirements, special_requirements_amount, 
    early_checkin_amount, late_checkout_amount, stay_cosy_amount,
    total_tariff, advance, check_in_time, check_out_time, address, id_proof
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO reservations (
        guest_name, guest_email, guest_phone, check_in, check_out, 
        adults, children, room_type, num_rooms, room_details,
        special_requirements, special_requirements_amount,
        early_checkin_amount, late_checkout_amount, stay_cosy_amount,
        total_tariff, advance, check_in_time, check_out_time, created_by,
        address, id_proof
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guest_name, guest_email || null, guest_phone, check_in, check_out, 
        adults, children, room_type, num_rooms, 
        room_details ? JSON.stringify(room_details) : null,
        special_requirements || null, special_requirements_amount || 0,
        early_checkin_amount || 0, late_checkout_amount || 0, stay_cosy_amount || 0,
        total_tariff, advance, 
        check_in_time || '12:00 Noon', 
        check_out_time || '11:00 A.M',
        req.user?.id || null,
        address || null,
        id_proof || null
      ]
    );

    // Auto-create or update customer profile
    try {
      const [existing] = await pool.query('SELECT id FROM customers WHERE phone = ?', [guest_phone]);
      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO customers (full_name, email, phone, room_type, loyalty_status, address, id_proof)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [guest_name, guest_email || null, guest_phone, room_type || null, 'New', address || null, id_proof || null]
        );
      } else {
        await pool.query(
          `UPDATE customers SET full_name = ?, email = ?, room_type = ?, address = ?, id_proof = ? WHERE phone = ?`,
          [guest_name, guest_email || null, room_type || null, address || null, id_proof || null, guest_phone]
        );
      }
    } catch (custErr) {
      console.error('Auto-create customer error:', custErr.message);
    }

    // Trigger email (aync, don't wait for it to respond to user)
    if (guest_email) {
      emailService.sendInvoiceEmail({
        id: result.insertId,
        guest_name, guest_email, guest_phone, check_in, check_out,
        adults, children, room_type, num_rooms, room_details,
        special_requirements, special_requirements_amount,
        early_checkin_amount, late_checkout_amount, stay_cosy_amount,
        total_tariff, advance
      }).catch(err => console.error('Background email error:', err));
    }

    res.status(201).json({ message: 'Reservation created', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE reservations SET status = ? WHERE id = ?', [status, id]);

    // Automatically send invoice if status is marked as Completed
    if (status === 'Completed') {
      const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
      if (rows.length > 0 && rows[0].guest_email) {
        emailService.sendInvoiceEmail(rows[0]).catch(err => console.error('Auto email error:', err));
      }
    }

    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReservation = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM reservations WHERE id = ?', [id]);
    res.json({ message: 'Reservation deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendManualInvoice = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reservation not found' });
    
    const reservation = rows[0];
    if (!reservation.guest_email) {
      return res.status(400).json({ message: 'Guest has no email address' });
    }

    const info = await emailService.sendInvoiceEmail(reservation);
    if (info) {
      res.json({ message: 'Invoice email sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send email' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendManualReceipt = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM reservations WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Reservation not found' });
    
    const reservation = rows[0];
    if (!reservation.guest_email) {
      return res.status(400).json({ message: 'Guest has no email address' });
    }

    const info = await emailService.sendReceiptEmail(reservation);
    if (info) {
      res.json({ message: 'Receipt email sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send receipt email' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
