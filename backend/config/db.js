const mysql = require('mysql2/promise');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// --- Debug: confirm env vars reached this process (never log password) ---
console.log('🔎 DB Config Loaded:', {
  env,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  hasPassword: Boolean(process.env.DB_PASSWORD),
});

// Validate required vars
const missing = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Missing required DB environment variables: ${missing.join(', ')}`);
  console.error('  → Local: check your backend/.env file');
  console.error('  → Hostinger: check hPanel → Node.js App → Environment Variables');
}

// SSL: only use for non-local hosts
const isLocalHost =
  !process.env.DB_HOST ||
  process.env.DB_HOST === 'localhost' ||
  process.env.DB_HOST === '127.0.0.1';

const sslOption =
  process.env.DB_SSL === 'false'
    ? false
    : process.env.DB_SSL === 'true' || (!isLocalHost && isProduction)
    ? { rejectUnauthorized: false }
    : false;

const pool = mysql.createPool({
  host:     (process.env.DB_HOST || 'localhost').trim(),
  user:     (process.env.DB_USER || 'root').trim(),
  password: process.env.DB_PASSWORD || '',
  database: (process.env.DB_NAME || 'dazzle_drop').trim(),
  port:     Number(process.env.DB_PORT) || 3306,
  ssl:      sslOption,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

// Surface pool-level errors (dropped connections, etc.)
pool.on('error', (err) => {
  console.error('❌ MySQL Pool Error:', err.code || err.message);
});

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL Connected — DB: ${process.env.DB_NAME} | Host: ${process.env.DB_HOST}`);

    // ── users ──────────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'staff') DEFAULT 'staff',
        phone VARCHAR(20),
        branch_location VARCHAR(100) DEFAULT 'Chennai',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── customers ──────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        id_proof VARCHAR(100),
        address TEXT,
        room_no VARCHAR(20),
        room_type VARCHAR(50),
        loyalty_status VARCHAR(50) DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── reservations ───────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guest_name VARCHAR(100) NOT NULL,
        guest_email VARCHAR(100),
        guest_phone VARCHAR(20) NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        adults INT DEFAULT 1,
        children INT DEFAULT 0,
        room_type VARCHAR(50),
        num_rooms INT DEFAULT 1,
        room_details TEXT,
        special_requirements TEXT,
        special_requirements_amount DECIMAL(10,2) DEFAULT 0,
        early_checkin_amount DECIMAL(10,2) DEFAULT 0,
        late_checkout_amount DECIMAL(10,2) DEFAULT 0,
        stay_cosy_amount DECIMAL(10,2) DEFAULT 0,
        total_tariff DECIMAL(10,2),
        advance DECIMAL(10,2),
        status ENUM('Upcoming','Active','Completed','Cancelled','Pending','Confirmed','Hold') DEFAULT 'Upcoming',
        address TEXT,
        id_proof VARCHAR(100),
        check_in_time VARCHAR(20) DEFAULT '12:00 Noon',
        check_out_time VARCHAR(20) DEFAULT '11:00 A.M',
        breakfast VARCHAR(255) DEFAULT 'Breakfast Included',
        breakfast_amount DECIMAL(10,2) DEFAULT 0.00,
        location VARCHAR(100) DEFAULT 'Ooty',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── enquiries ──────────────────────────────────────────────────────
    await connection.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guest_name VARCHAR(100) NOT NULL,
        guest_email VARCHAR(100),
        guest_phone VARCHAR(20) NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        adults INT DEFAULT 1,
        children INT DEFAULT 0,
        room_type VARCHAR(50),
        num_rooms INT DEFAULT 1,
        room_details TEXT,
        special_requirements TEXT,
        special_requirements_amount DECIMAL(10,2) DEFAULT 0,
        early_checkin_amount DECIMAL(10,2) DEFAULT 0,
        late_checkout_amount DECIMAL(10,2) DEFAULT 0,
        stay_cosy_amount DECIMAL(10,2) DEFAULT 0,
        total_tariff DECIMAL(10,2),
        advance DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Enquiry',
        booked_by VARCHAR(50) DEFAULT 'Direct',
        comments TEXT,
        address TEXT,
        id_proof VARCHAR(100),
        check_in_time VARCHAR(20) DEFAULT '12:00 Noon',
        check_out_time VARCHAR(20) DEFAULT '11:00 A.M',
        breakfast VARCHAR(255) DEFAULT 'Breakfast Included',
        breakfast_amount DECIMAL(10,2) DEFAULT 0.00,
        location VARCHAR(100) DEFAULT 'Chennai',
        created_by INT,
        reservation_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── Safe ALTER migrations (safe to re-run; ignores "already exists") ──
    const safeAlter = async (sql) => {
      try { await connection.query(sql); } catch (e) { /* column already exists — OK */ }
    };

    await safeAlter("ALTER TABLE customers ADD COLUMN loyalty_status VARCHAR(50) DEFAULT 'New'");
    await safeAlter("ALTER TABLE reservations ADD COLUMN address TEXT");
    await safeAlter("ALTER TABLE reservations ADD COLUMN id_proof VARCHAR(100)");
    await safeAlter("ALTER TABLE reservations ADD COLUMN location VARCHAR(100) DEFAULT 'Ooty'");
    await safeAlter("ALTER TABLE reservations ADD COLUMN check_in_time VARCHAR(20) DEFAULT '12:00 Noon'");
    await safeAlter("ALTER TABLE reservations ADD COLUMN check_out_time VARCHAR(20) DEFAULT '11:00 A.M'");
    await safeAlter("ALTER TABLE reservations ADD COLUMN breakfast VARCHAR(255) DEFAULT 'Breakfast Included'");
    await safeAlter("ALTER TABLE reservations ADD COLUMN breakfast_amount DECIMAL(10,2) DEFAULT 0.00");
    await safeAlter("ALTER TABLE reservations ADD COLUMN created_by INT");
    await safeAlter("ALTER TABLE enquiries ADD COLUMN comments TEXT");
    await safeAlter("ALTER TABLE enquiries ADD COLUMN booked_by VARCHAR(50) DEFAULT 'Direct'");
    await safeAlter("ALTER TABLE enquiries ADD COLUMN reservation_id INT DEFAULT NULL");
    await safeAlter("ALTER TABLE users ADD COLUMN branch_location VARCHAR(100) DEFAULT 'Chennai'");

    // Safe index creation
    try {
      await connection.query('CREATE INDEX idx_customers_phone ON customers(phone)');
    } catch (e) { /* index already exists — OK */ }

    // Modify status ENUM safely
    try {
      await connection.query(
        "ALTER TABLE reservations MODIFY COLUMN status ENUM('Upcoming','Active','Completed','Cancelled','Pending','Confirmed','Hold') DEFAULT 'Upcoming'"
      );
    } catch (e) { /* ignore */ }

    // ── Seed default admin if not exists ──────────────────────────────
    const bcrypt = require('bcryptjs');
    const [adminRows] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin12@gmail.com']);
    if (adminRows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin@123', 10);
      await connection.query(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', 'admin12@gmail.com', hashedPassword, 'admin']
      );
      console.log('✅ Default admin created: admin12@gmail.com / admin@123');
    }

    connection.release();
    console.log('✅ Database Tables Verified / Created Successfully');
  } catch (error) {
    console.error('❌ Database Initialization Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('  → Check DB_USER and DB_PASSWORD in your .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('  → Database does not exist. Create it first: CREATE DATABASE ' + process.env.DB_NAME);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('  → MySQL server is not running or DB_HOST/DB_PORT is wrong');
    }
    // Do NOT crash — backend continues to serve health/email routes even if DB fails
  }
};

module.exports = { pool, initDB };
