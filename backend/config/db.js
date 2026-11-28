const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';
const isWindows = process.platform === 'win32';

// Check if configured host is localhost
const rawHost = (process.env.DB_HOST || 'localhost').trim();
const isLocalHost = !rawHost || rawHost === 'localhost' || rawHost === '127.0.0.1';

// Detect if Hostinger user is configured while running on local Windows
const isHostingerUser = (process.env.DB_USER || '').startsWith('u853918251_');

let dbConfig = {
  host: rawHost,
  user: (process.env.DB_USER || 'root').trim(),
  password: process.env.DB_PASSWORD || '',
  database: (process.env.DB_NAME || 'dazzle_drop').trim(),
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// If running on local Windows machine and Hostinger credentials were left in .env,
// switch to local root credentials automatically to avoid "Access Denied" errors
if (isWindows && isHostingerUser && isLocalHost) {
  console.log('💡 Note: Hostinger database credentials detected on local machine.');
  console.log('   Using local MySQL credentials (root / dazzle_drop)...');
  dbConfig = {
    host: 'localhost',
    user: 'root',
    password: process.env.LOCAL_DB_PASSWORD || 'Gopinath@10',
    database: 'dazzle_drop',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

// SSL configuration
const sslOption =
  process.env.DB_SSL === 'false'
    ? false
    : process.env.DB_SSL === 'true' || (!isLocalHost && isProduction)
    ? { rejectUnauthorized: false }
    : false;

if (sslOption) {
  dbConfig.ssl = sslOption;
}

console.log('🔎 DB Config Loaded:', {
  env,
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  hasPassword: Boolean(dbConfig.password),
});

const createPoolInstance = (cfg) => {
  const p = mysql.createPool(cfg);
  p.on('error', (err) => {
    console.error('❌ MySQL Pool Error:', err.code || err.message);
  });
  return p;
};

let activePool = createPoolInstance(dbConfig);

// Dynamic proxy so all controllers importing `pool` automatically route to the active working pool
const pool = new Proxy({}, {
  get(target, prop) {
    const val = activePool[prop];
    return typeof val === 'function' ? val.bind(activePool) : val;
  }
});

const initDB = async () => {
  let connection;
  try {
    connection = await activePool.getConnection();
  } catch (error) {
    // If access was denied on localhost, attempt fallback to local root credentials
    if (error.code === 'ER_ACCESS_DENIED_ERROR' && isLocalHost) {
      console.warn(`⚠️ Access denied for user '${dbConfig.user}' on localhost.`);
      console.log('🔄 Attempting fallback to local root credentials (root / dazzle_drop)...');
      try {
        const fallbackConfig = {
          host: 'localhost',
          user: 'root',
          password: process.env.LOCAL_DB_PASSWORD || 'Gopinath@10',
          database: 'dazzle_drop',
          port: 3306,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        };
        const fallbackPool = createPoolInstance(fallbackConfig);
        connection = await fallbackPool.getConnection();
        activePool = fallbackPool;
        dbConfig = fallbackConfig;
        console.log('✅ Connected via fallback credentials (root / dazzle_drop)');
      } catch (fbErr) {
        console.error('❌ Local fallback connection also failed:', fbErr.message);
        return;
      }
    } else {
      console.error('❌ Database Initialization Error:', error.message);
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('  → Check DB_USER and DB_PASSWORD in your .env file');
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        console.error('  → Database does not exist. Create it first: CREATE DATABASE ' + dbConfig.database);
      } else if (error.code === 'ECONNREFUSED') {
        console.error('  → MySQL server is not running or DB_HOST/DB_PORT is wrong');
      }
      return;
    }
  }

  try {
    console.log(`✅ MySQL Connected — DB: ${dbConfig.database} | Host: ${dbConfig.host} | User: ${dbConfig.user}`);

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
  }
};

module.exports = { pool, initDB };
