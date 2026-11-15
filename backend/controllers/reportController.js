const { pool } = require('../config/db');

const TOTAL_ROOMS = 45;

exports.getDashboardStats = async (req, res) => {
  try {
    const [[{ totalReservations }]] = await pool.query(
      'SELECT COUNT(*) AS totalReservations FROM reservations'
    );
    const [[{ monthlyRevenue }]] = await pool.query(
      `SELECT COALESCE(SUM(total_tariff), 0) AS monthlyRevenue FROM reservations
       WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())`
    );
    const [[{ activeCount }]] = await pool.query(
      `SELECT COUNT(*) AS activeCount FROM reservations WHERE status IN ('Active', 'Upcoming')`
    );
    const [[{ todayCheckIns }]] = await pool.query(
      `SELECT COUNT(*) AS todayCheckIns FROM reservations
       WHERE check_in = CURRENT_DATE() AND status != 'Cancelled'`
    );

    const occupiedRooms = activeCount;
    const occupancyRate = TOTAL_ROOMS > 0 ? Math.round((occupiedRooms / TOTAL_ROOMS) * 100) : 0;
    const availableRooms = Math.max(0, TOTAL_ROOMS - occupiedRooms);

    res.json({
      totalReservations,
      monthlyRevenue: Number(monthlyRevenue),
      occupancyRate,
      availableRooms,
      totalRooms: TOTAL_ROOMS,
      todayCheckIns,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, guest_name, room_type, status, created_at, check_in
       FROM reservations ORDER BY created_at DESC LIMIT 10`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFinanceOverview = async (req, res) => {
  try {
    const [[{ monthlyIncome }]] = await pool.query(
      `SELECT COALESCE(SUM(total_tariff), 0) AS monthlyIncome FROM reservations
       WHERE status IN ('Completed', 'Active')
       AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())`
    );
    const [[{ pendingAmount }]] = await pool.query(
      `SELECT COALESCE(SUM(total_tariff - COALESCE(advance, 0)), 0) AS pendingAmount FROM reservations
       WHERE status IN ('Upcoming', 'Active')`
    );
    const [[{ totalCollected }]] = await pool.query(
      `SELECT COALESCE(SUM(COALESCE(advance, 0)), 0) AS totalCollected FROM reservations`
    );

    const [transactions] = await pool.query(
      `SELECT id, guest_name, room_type, total_tariff, advance, status, created_at
       FROM reservations ORDER BY created_at DESC LIMIT 20`
    );

    res.json({
      currentBalance: Number(totalCollected),
      monthlyIncome: Number(monthlyIncome),
      monthlyExpenses: 0,
      pendingAmount: Number(pendingAmount),
      transactions: transactions.map((r) => ({
        id: r.id,
        type: 'Income',
        amount: Number(r.total_tariff),
        status: r.status === 'Cancelled' ? 'Cancelled' : r.advance >= r.total_tariff ? 'Completed' : 'Pending',
        date: r.created_at,
        user: `${r.guest_name} - ${r.room_type || 'Room'}`,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, guest_name, total_tariff, advance, status, created_at, check_in
       FROM reservations ORDER BY created_at DESC`
    );

    const invoices = rows.map((r) => {
      const balance = Number(r.total_tariff) - Number(r.advance || 0);
      let paymentStatus = 'Paid';
      if (r.status === 'Cancelled') paymentStatus = 'Cancelled';
      else if (balance > 0 && r.status === 'Upcoming') paymentStatus = 'Pending';
      else if (balance > 0) paymentStatus = 'Overdue';

      return {
        id: `INV-${String(r.id).padStart(4, '0')}`,
        reservationId: r.id,
        client: r.guest_name,
        date: r.created_at,
        amount: Number(r.total_tariff),
        advance: Number(r.advance || 0),
        status: paymentStatus,
        method: r.advance > 0 ? 'Advance Paid' : 'Pending',
      };
    });

    const totalCollected = invoices
      .filter((i) => i.status === 'Paid')
      .reduce((sum, i) => sum + i.amount, 0);
    const pendingPayment = invoices
      .filter((i) => i.status === 'Pending')
      .reduce((sum, i) => sum + (i.amount - i.advance), 0);
    const overdue = invoices
      .filter((i) => i.status === 'Overdue')
      .reduce((sum, i) => sum + (i.amount - i.advance), 0);

    res.json({
      invoices,
      summary: {
        totalCollected,
        pendingPayment,
        overdue,
        totalInvoices: invoices.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStaffRevenueReport = async (req, res) => {
  try {
    const { period } = req.query; // 'daily', 'monthly', 'yearly'
    const { id: userId, role } = req.user;

    let dateFilter = '';
    if (period === 'daily') {
      dateFilter = 'AND DATE(r.created_at) = CURRENT_DATE()';
    } else if (period === 'monthly') {
      dateFilter = 'AND MONTH(r.created_at) = MONTH(CURRENT_DATE()) AND YEAR(r.created_at) = YEAR(CURRENT_DATE())';
    } else if (period === 'yearly') {
      dateFilter = 'AND YEAR(r.created_at) = YEAR(CURRENT_DATE())';
    }

    // Staff: only their own revenue. Admin: all staff revenue.
    const userFilter = role === 'admin' ? '' : `AND u.id = ${pool.escape(userId).replace(/'/g, '')}`;

    const [rows] = await pool.query(`
      SELECT 
        u.id AS staff_id,
        u.full_name AS staff_name, 
        u.email AS staff_email,
        COUNT(r.id) AS total_bookings,
        COALESCE(SUM(r.total_tariff), 0) AS total_revenue
      FROM users u
      LEFT JOIN reservations r ON r.created_by = u.id ${dateFilter}
      WHERE (u.role = 'staff' OR u.role = 'admin') ${userFilter}
      GROUP BY u.id
      ORDER BY total_revenue DESC
    `);

    res.json({ rows, role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getReportsData = async (req, res) => {
  try {
    const [[{ totalReservations }]] = await pool.query('SELECT COUNT(*) AS totalReservations FROM reservations');
    const [[{ totalRevenue }]] = await pool.query(
      'SELECT COALESCE(SUM(total_tariff), 0) AS totalRevenue FROM reservations WHERE status != "Cancelled"'
    );
    const [[{ avgRate }]] = await pool.query(
      'SELECT COALESCE(AVG(total_tariff), 0) AS avgRate FROM reservations WHERE status != "Cancelled"'
    );
    const [[{ customerCount }]] = await pool.query('SELECT COUNT(*) AS customerCount FROM customers');
    const [[{ completedCount }]] = await pool.query(
      `SELECT COUNT(*) AS completedCount FROM reservations WHERE status = 'Completed'`
    );

    const occupancyRate = TOTAL_ROOMS > 0
      ? Math.round((totalReservations / (TOTAL_ROOMS * 12)) * 100)
      : 0;

    const [monthlyData] = await pool.query(
      `SELECT MONTH(created_at) AS month, COUNT(*) AS count, COALESCE(SUM(total_tariff), 0) AS revenue
       FROM reservations WHERE YEAR(created_at) = YEAR(CURRENT_DATE())
       GROUP BY MONTH(created_at) ORDER BY month`
    );

    const months = Array(12).fill(0);
    monthlyData.forEach((m) => {
      months[m.month - 1] = m.count;
    });

    const maxCount = Math.max(...months, 1);
    const chartHeights = months.map((c) => Math.round((c / maxCount) * 100));

    res.json({
      kpis: {
        avgDailyRate: Math.round(Number(avgRate)),
        revpar: Math.round(Number(avgRate) * (occupancyRate / 100)),
        totalReservations,
        totalRevenue: Number(totalRevenue),
        customerCount,
        loyaltyRate: customerCount > 0 ? Math.round((completedCount / customerCount) * 100) : 0,
      },
      chartHeights,
      monthlyRevenue: monthlyData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStaffRecordReport = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const selectedStaffId = req.query.staff_id;

    let targetStaffId = userId;
    if (role === 'admin' && selectedStaffId && selectedStaffId !== 'all') {
      targetStaffId = Number(selectedStaffId);
    }

    const isAll = role === 'admin' && selectedStaffId === 'all';

    let [staffUserRows] = await pool.query(
      'SELECT id, full_name, email, role, phone FROM users WHERE id = ?',
      [targetStaffId]
    );

    let currentStaff = staffUserRows[0] || { id: userId, full_name: 'Staff Member', role, email: '' };

    let [allStaff] = await pool.query(
      "SELECT id, full_name, email, role FROM users WHERE role IN ('staff', 'admin') ORDER BY full_name ASC"
    );

    const whereClause = isAll ? '' : 'WHERE created_by = ?';
    const queryParams = isAll ? [] : [targetStaffId];

    const [enquiries] = await pool.query(
      `SELECT e.*, u.full_name AS creator_name 
       FROM enquiries e 
       LEFT JOIN users u ON e.created_by = u.id 
       ${whereClause} 
       ORDER BY e.created_at DESC`,
      queryParams
    );

    const [reservations] = await pool.query(
      `SELECT r.*, u.full_name AS creator_name 
       FROM reservations r 
       LEFT JOIN users u ON r.created_by = u.id 
       ${whereClause} 
       ORDER BY r.created_at DESC`,
      queryParams
    );

    const visibleEnquiries = enquiries.filter(e => !e.reservation_id && e.status !== 'Converted');

    const totalEnquiries = visibleEnquiries.length;
    const totalReservations = reservations.length;
    const legacyConvertedEnquiries = enquiries.filter(e => e.status === 'Converted' && !e.reservation_id).length;
    const totalAttended = totalEnquiries + totalReservations;
    const totalConverted = totalReservations + legacyConvertedEnquiries;
    const pendingEnquiries = visibleEnquiries.filter(e => e.status === 'Pending').length;
    const cancelledCount = visibleEnquiries.filter(e => e.status === 'Cancelled').length;

    const totalRevenue = reservations.reduce((acc, r) => acc + Number(r.total_tariff || 0), 0);
    const conversionRate = totalAttended > 0 ? Math.round((totalConverted / totalAttended) * 100) : 0;

    // Combine for record log without repeating the same enquiry once it is converted to a reservation
    const combinedRecords = [
      ...visibleEnquiries.map(e => ({ ...e, isEnquiryOnly: true })),
      ...reservations.map(r => ({ ...r, isEnquiryOnly: false }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      staffInfo: {
        id: isAll ? 'ALL' : currentStaff.id,
        name: isAll ? 'All Staff Members' : currentStaff.full_name,
        email: isAll ? 'system@hotel.com' : currentStaff.email,
        role: isAll ? 'admin' : currentStaff.role,
        phone: currentStaff.phone || '',
      },
      stats: {
        enquiriesAttended: totalAttended,
        convertedToReservation: totalConverted,
        pendingEnquiries,
        cancelledCount,
        conversionRate,
        totalRevenue,
      },
      allStaff,
      records: combinedRecords,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

