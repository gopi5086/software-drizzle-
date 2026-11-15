const { pool } = require('../config/db');
const emailService = require('../utils/emailService');

const formatDateForDB = (dateVal) => {
  if (!dateVal) return null;
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

exports.getEnquiries = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT e.*, u.full_name AS creator_name 
       FROM enquiries e 
       LEFT JOIN users u ON e.created_by = u.id 
       ORDER BY e.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEnquiryById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createEnquiry = async (req, res) => {
  const { 
    guest_name, guest_email, guest_phone, check_in, check_out, 
    adults, children, room_type, num_rooms, room_details, 
    special_requirements, special_requirements_amount, 
    early_checkin_amount, late_checkout_amount, stay_cosy_amount,
    total_tariff, advance, check_in_time, check_out_time, address, id_proof,
    breakfast, breakfast_amount, location, status, booked_by, comments
  } = req.body;

  try {
    const [result] = await pool.query(
      `INSERT INTO enquiries (
        guest_name, guest_email, guest_phone, check_in, check_out, 
        adults, children, room_type, num_rooms, room_details,
        special_requirements, special_requirements_amount,
        early_checkin_amount, late_checkout_amount, stay_cosy_amount,
        total_tariff, advance, check_in_time, check_out_time, created_by,
        address, id_proof, breakfast, breakfast_amount, location, status, booked_by, comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guest_name, guest_email || null, guest_phone, formatDateForDB(check_in), formatDateForDB(check_out), 
        adults || 1, children || 0, room_type, num_rooms || 1, 
        room_details ? (typeof room_details === 'string' ? room_details : JSON.stringify(room_details)) : null,
        special_requirements || null, special_requirements_amount || 0,
        early_checkin_amount || 0, late_checkout_amount || 0, stay_cosy_amount || 0,
        total_tariff || 0, advance || 0, 
        check_in_time || '12:00 Noon', 
        check_out_time || '11:00 A.M',
        req.user?.id || null,
        address || null,
        id_proof || null,
        breakfast !== undefined ? breakfast : 'Breakfast Included',
        breakfast_amount !== undefined ? breakfast_amount : 0.00,
        location || 'Chennai',
        status || 'Enquiry',
        booked_by || 'Direct',
        comments || null,
      ]
    );
    res.status(201).json({ message: 'Enquiry saved successfully', id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.convertEnquiryToReservation = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Enquiry not found' });
    const enq = rows[0];

    // Check if already converted and that reservation actually exists in database
    if (enq.reservation_id) {
      try {
        const [existingRes] = await pool.query('SELECT id FROM reservations WHERE id = ?', [enq.reservation_id]);
        if (existingRes.length > 0) {
          return res.status(400).json({
            message: `Enquiry is already converted to reservation #${enq.reservation_id}`,
            reservation_id: enq.reservation_id
          });
        }
      } catch (checkErr) {
        // Continue if checking fails
      }
    }

    // Safely format dates (default to today if missing so NOT NULL constraint never fails)
    const todayStr = new Date().toISOString().split('T')[0];
    const checkInDate = formatDateForDB(enq.check_in) || todayStr;
    const checkOutDate = formatDateForDB(enq.check_out) || checkInDate;

    // Room details must be stringified or null (never a raw Array/Object which breaks mysql2 query placeholder)
    let roomDetailsStr = null;
    if (enq.room_details) {
      roomDetailsStr = typeof enq.room_details === 'string'
        ? enq.room_details
        : JSON.stringify(enq.room_details);
    } else if (enq.room_type) {
      roomDetailsStr = JSON.stringify([{
        type: enq.room_type,
        count: Number(enq.num_rooms) || 1,
        rate: Number(enq.total_tariff) || 0
      }]);
    }

    // Validate created_by against users table to prevent Foreign Key constraint violation
    let validCreatedBy = null;
    const candidateUserId = req.user?.id || enq.created_by;
    if (candidateUserId) {
      try {
        const [userRows] = await pool.query('SELECT id FROM users WHERE id = ?', [candidateUserId]);
        if (userRows.length > 0) {
          validCreatedBy = userRows[0].id;
        }
      } catch (err) {
        validCreatedBy = null;
      }
    }

    // Sanitize numeric fields to prevent NaN or data truncation errors
    const numRooms = Number(enq.num_rooms) || 1;
    const adults = Number(enq.adults) || 1;
    const children = Number(enq.children) || 0;
    const specialReqAmount = Number(enq.special_requirements_amount) || 0;
    const earlyCheckinAmount = Number(enq.early_checkin_amount) || 0;
    const lateCheckoutAmount = Number(enq.late_checkout_amount) || 0;
    const stayCosyAmount = Number(enq.stay_cosy_amount) || 0;
    const totalTariff = Number(enq.total_tariff) || 0;
    const advance = Number(enq.advance) || 0;
    const breakfastAmount = Number(enq.breakfast_amount) || 0;

    const [result] = await pool.query(
      `INSERT INTO reservations (
        guest_name, guest_email, guest_phone, check_in, check_out, 
        adults, children, room_type, num_rooms, room_details,
        special_requirements, special_requirements_amount,
        early_checkin_amount, late_checkout_amount, stay_cosy_amount,
        total_tariff, advance, check_in_time, check_out_time, created_by,
        address, id_proof, breakfast, breakfast_amount, location, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        enq.guest_name || 'Guest',
        enq.guest_email || null,
        enq.guest_phone || '',
        checkInDate,
        checkOutDate,
        adults,
        children,
        enq.room_type || 'Deluxe Room',
        numRooms,
        roomDetailsStr,
        enq.special_requirements || null,
        specialReqAmount,
        earlyCheckinAmount,
        lateCheckoutAmount,
        stayCosyAmount,
        totalTariff,
        advance,
        enq.check_in_time || '12:00 Noon',
        enq.check_out_time || '11:00 A.M',
        validCreatedBy,
        enq.address || null,
        enq.id_proof || null,
        enq.breakfast || 'Breakfast Included',
        breakfastAmount,
        enq.location || 'Chennai',
        'Confirmed'
      ]
    );

    const reservationId = result.insertId;

    // Safely update enquiry status and reservation_id (ensuring column exists)
    try {
      await pool.query('UPDATE enquiries SET status = ?, reservation_id = ? WHERE id = ?', ['Converted', reservationId, id]);
    } catch (updateErr) {
      try {
        await pool.query('ALTER TABLE enquiries ADD COLUMN reservation_id INT');
        await pool.query('UPDATE enquiries SET status = ?, reservation_id = ? WHERE id = ?', ['Converted', reservationId, id]);
      } catch (colErr) {
        await pool.query('UPDATE enquiries SET status = ? WHERE id = ?', ['Converted', id]);
      }
    }

    // Customer sync
    try {
      if (enq.guest_phone) {
        const [existing] = await pool.query('SELECT id FROM customers WHERE phone = ?', [enq.guest_phone]);
        if (existing.length === 0) {
          await pool.query(
            `INSERT INTO customers (full_name, email, phone, room_type, loyalty_status, address, id_proof) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [enq.guest_name, enq.guest_email || null, enq.guest_phone, enq.room_type || null, 'New', enq.address || null, enq.id_proof || null]
          );
        }
      }
    } catch (custErr) {
      console.error('Customer sync error:', custErr.message);
    }

    res.json({
      message: 'Enquiry accepted & added to Reservation database!',
      reservation_id: reservationId
    });
  } catch (error) {
    console.error('convertEnquiryToReservation error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateEnquiry = async (req, res) => {
  const { id } = req.params;
  const {
    guest_name, guest_email, guest_phone, check_in, check_out,
    adults, children, room_type, num_rooms, room_details,
    special_requirements, special_requirements_amount,
    early_checkin_amount, late_checkout_amount, stay_cosy_amount,
    total_tariff, advance, check_in_time, check_out_time, address, id_proof,
    breakfast, breakfast_amount, location, status, booked_by, comments
  } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE enquiries SET
        guest_name = ?, guest_email = ?, guest_phone = ?, check_in = ?, check_out = ?,
        adults = ?, children = ?, room_type = ?, num_rooms = ?, room_details = ?,
        special_requirements = ?, special_requirements_amount = ?,
        early_checkin_amount = ?, late_checkout_amount = ?, stay_cosy_amount = ?,
        total_tariff = ?, advance = ?, check_in_time = ?, check_out_time = ?,
        address = ?, id_proof = ?, breakfast = ?, breakfast_amount = ?,
        location = ?, status = ?, booked_by = ?, comments = ?
      WHERE id = ?`,
      [
        guest_name, guest_email || null, guest_phone, formatDateForDB(check_in), formatDateForDB(check_out),
        adults || 1, children || 0, room_type, num_rooms || 1,
        room_details ? (typeof room_details === 'string' ? room_details : JSON.stringify(room_details)) : null,
        special_requirements || null, special_requirements_amount || 0,
        early_checkin_amount || 0, late_checkout_amount || 0, stay_cosy_amount || 0,
        total_tariff || 0, advance || 0,
        check_in_time || '12:00 Noon', check_out_time || '11:00 A.M',
        address || null, id_proof || null,
        breakfast !== undefined ? breakfast : 'Breakfast Included',
        breakfast_amount !== undefined ? breakfast_amount : 0.00,
        location || 'Chennai', status || 'Enquiry', booked_by || 'Direct', comments || null, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json({ message: 'Enquiry updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE enquiries SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Enquiry status updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEnquiry = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM enquiries WHERE id = ?', [id]);
    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendEnquiryEmail = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Enquiry not found' });

    const enquiry = rows[0];
    if (!enquiry.guest_email) {
      return res.status(400).json({ message: 'Guest has no email address on this enquiry' });
    }

    const info = await emailService.sendEnquiryEmail(enquiry);
    if (info) {
      res.json({ message: 'Quotation invoice email sent to ' + enquiry.guest_email });
    } else {
      res.status(500).json({ message: 'Failed to send email. Check SMTP configuration.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
