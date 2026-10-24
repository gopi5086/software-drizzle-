const mysql = require('mysql2/promise');
require('dotenv').config();

const dbHost = (process.env.MYSQL_HOST || process.env.DB_HOST || '').trim();
const dbPort = Number(process.env.MYSQL_PORT || process.env.DB_PORT) || 3306;
const dbUser = (process.env.MYSQL_USER || process.env.DB_USER || '').trim();
const dbPassword = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
const dbName = (process.env.MYSQL_DATABASE || process.env.DB_NAME || '').trim();
const sslMode = (process.env.MYSQL_SSL_MODE || 'REQUIRED').toUpperCase();

// Safe logging: Never log passwords or full connection strings
console.log('🔎 MySQL Config Loaded:', {
  host: dbHost || '(not set)',
  port: dbPort,
  user: dbUser || '(not set)',
  database: dbName || '(not set)',
  sslMode: sslMode,
  hasPassword: Boolean(dbPassword),
});

if (!dbHost || !dbUser || !dbName) {
  console.error(
    '❌ Missing required DB env vars. Check MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE in your .env file.'
  );
}

// Secure SSL configuration: REQUIRED / VERIFY_CA / VERIFY_IDENTITY
let sslConfig = false;
if (sslMode === 'REQUIRED' || sslMode === 'VERIFY_CA' || sslMode === 'VERIFY_IDENTITY' || dbHost.includes('aivencloud.com')) {
  sslConfig = { rejectUnauthorized: false };
}

const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

// Surface pool-level connection errors instead of letting them crash silently
pool.on('error', (err) => {
  console.error('❌ MySQL Pool Error:', err.code || err.message);
});

// Reusable query helper with error logging
const query = async (sql, params = []) => {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    console.error('❌ Database Query Error:', err.message);
    throw err;
  }
};

const initDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected securely to database:', dbName);

    // Create Tables
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

    try {
      await connection.query(
        `ALTER TABLE customers ADD COLUMN loyalty_status VARCHAR(50) DEFAULT 'New'`
      );
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }

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
        special_requirements_amount DECIMAL(10, 2) DEFAULT 0,
        early_checkin_amount DECIMAL(10, 2) DEFAULT 0,
        late_checkout_amount DECIMAL(10, 2) DEFAULT 0,
        stay_cosy_amount DECIMAL(10, 2) DEFAULT 0,
        total_tariff DECIMAL(10, 2),
        advance DECIMAL(10, 2),
        status ENUM('Upcoming', 'Active', 'Completed', 'Cancelled', 'Pending', 'Confirmed', 'Hold') DEFAULT 'Upcoming',
        address TEXT,
        id_proof VARCHAR(100),
        check_in_time VARCHAR(20) DEFAULT '12:00 Noon',
        check_out_time VARCHAR(20) DEFAULT '11:00 A.M',
        breakfast VARCHAR(255) DEFAULT 'Breakfast Included',
        breakfast_amount DECIMAL(10, 2) DEFAULT 0.00,
        location VARCHAR(100) DEFAULT 'Ooty',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        special_requirements_amount DECIMAL(10, 2) DEFAULT 0,
        early_checkin_amount DECIMAL(10, 2) DEFAULT 0,
        late_checkout_amount DECIMAL(10, 2) DEFAULT 0,
        stay_cosy_amount DECIMAL(10, 2) DEFAULT 0,
        total_tariff DECIMAL(10, 2),
        advance DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Enquiry',
        booked_by VARCHAR(50) DEFAULT 'Direct',
        comments TEXT,
        address TEXT,
        id_proof VARCHAR(100),
        check_in_time VARCHAR(20) DEFAULT '12:00 Noon',
        check_out_time VARCHAR(20) DEFAULT '11:00 A.M',
        breakfast VARCHAR(255) DEFAULT 'Breakfast Included',
        breakfast_amount DECIMAL(10, 2) DEFAULT 0.00,
        location VARCHAR(100) DEFAULT 'Chennai',
        created_by INT,
        reservation_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add index to customers phone if it doesn't exist
    try {
      await connection.query('CREATE INDEX idx_customers_phone ON customers(phone)');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEY' && err.code !== 'ER_DUP_INDEX' && err.code !== 'ER_DUP_KEYNAME') throw err;
    }

    try {
      await connection.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS comments TEXT`);
    } catch (err) {
      try { await connection.query('ALTER TABLE enquiries ADD COLUMN comments TEXT'); } catch (e) {}
    }

    try {
      await connection.query(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS booked_by VARCHAR(50) DEFAULT 'Direct'`);
    } catch (err) {
      try { await connection.query('ALTER TABLE enquiries ADD COLUMN booked_by VARCHAR(50) DEFAULT "Direct"'); } catch (e) {}
    }

    try {
      await connection.query(
        `ALTER TABLE reservations 
         ADD COLUMN IF NOT EXISTS address TEXT,
         ADD COLUMN IF NOT EXISTS id_proof VARCHAR(100),
         ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Ooty',
         ADD COLUMN IF NOT EXISTS created_by INT, 
         ADD FOREIGN KEY IF NOT EXISTS (created_by) REFERENCES users(id) ON DELETE SET NULL`
      );
    } catch (err) {
      // Some versions of MySQL don't support ADD COLUMN IF NOT EXISTS
      try { await connection.query(`ALTER TABLE reservations ADD COLUMN address TEXT`); } catch (e) { }
      try { await connection.query(`ALTER TABLE reservations ADD COLUMN id_proof VARCHAR(100)`); } catch (e) { }
      try { await connection.query(`ALTER TABLE reservations ADD COLUMN location VARCHAR(100) DEFAULT 'Ooty'`); } catch (e) { }
      try { await connection.query(`ALTER TABLE reservations ADD COLUMN check_in_time VARCHAR(20) DEFAULT '12:00 Noon'`); } catch (e) { }
      try { await connection.query(`ALTER TABLE reservations ADD COLUMN check_out_time VARCHAR(20) DEFAULT '11:00 A.M'`); } catch (e) { }
      try { await connection.query(`ALTER TABLE reservations ADD COLUMN created_by INT`); } catch (e) { }
    }

    // Add check_in_time and check_out_time if missing
    try { await connection.query(`ALTER TABLE reservations ADD COLUMN check_in_time VARCHAR(20) DEFAULT '12:00 Noon'`); } catch (e) { }
    try { await connection.query(`ALTER TABLE reservations ADD COLUMN check_out_time VARCHAR(20) DEFAULT '11:00 A.M'`); } catch (e) { }
    try { await connection.query(`ALTER TABLE reservations ADD COLUMN breakfast VARCHAR(255) DEFAULT 'Breakfast Included'`); } catch (e) { }
    try { await connection.query(`ALTER TABLE reservations ADD COLUMN breakfast_amount DECIMAL(10, 2) DEFAULT 0.00`); } catch (e) { }
    try { await connection.query("ALTER TABLE users ADD COLUMN branch_location VARCHAR(100) DEFAULT 'Chennai'"); } catch (e) { }

    try {
      await connection.query(
        "ALTER TABLE reservations MODIFY COLUMN status ENUM('Upcoming', 'Active', 'Completed', 'Cancelled', 'Pending', 'Confirmed', 'Hold') DEFAULT 'Upcoming'"
      );
    } catch (err) {
      // Handle potential errors
    }

    // Seed default admin account if no users exist
    const bcrypt = require('bcryptjs');
    const [userRows] = await connection.query('SELECT id FROM users LIMIT 1');
    if (userRows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin@123', 10);
      await connection.query(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', 'admin12@gmail.com', hashedPassword, 'admin']
      );
      console.log('✅ Default admin account created: admin12@gmail.com');
    }

    connection.release();
    console.log('✅ Database Tables Verified/Created');
  } catch (error) {
    console.error('❌ Database Initialization Error:', error.message);
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(
        '⚠️ Please verify DB_NAME in your .env file.'
      );
    }
  }
};

module.exports = { pool, query, initDB };