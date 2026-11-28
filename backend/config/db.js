const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const isWindows = process.platform === 'win32';
const isProduction = env === 'production' || !isWindows;

// Determine default credentials based on environment:
// On Hostinger (Linux / Production): default to Hostinger database credentials
// On Local Machine (Windows / Development): default to local MySQL credentials
const defaultDbConfig = (!isWindows || isProduction)
  ? {
      host: '127.0.0.1',
      port: 3306,
      database: 'u853918251_drizzled',
      user: 'u853918251_Drizzle',
      password: 'Drizzledropinn@123',
    }
  : {
      host: 'localhost',
      port: 3306,
      database: 'dazzle_drop',
      user: 'root',
      password: 'Gopinath@10',
    };

// Check if user set custom env vars (ignore dead/expired Aiven cloud hosts)
const rawEnvHost = (process.env.DB_HOST || '').trim();
const isDeadAiven = rawEnvHost.includes('aivencloud.com');
const rawHost = (isDeadAiven || !rawEnvHost) ? defaultDbConfig.host : rawEnvHost;
const isLocalHost = !rawHost || rawHost === 'localhost' || rawHost === '127.0.0.1';
const isHostingerUser = (process.env.DB_USER || '').startsWith('u853918251_');

let dbConfig = {
  host: rawHost,
  user: (process.env.DB_USER || defaultDbConfig.user).trim(),
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : defaultDbConfig.password,
  database: (process.env.DB_NAME || defaultDbConfig.database).trim(),
  port: Number(process.env.DB_PORT) || defaultDbConfig.port,
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
  isProduction,
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
    console.warn(`⚠️ Primary DB connection failed (${error.code || error.message}) with host '${dbConfig.host}'`);

    // Variations to try on Hostinger: alternative hosts and alternative passwords
    const candidateHosts = ['127.0.0.1', 'localhost', 'srv679.hstgr.io'].filter(h => h !== dbConfig.host);
    const candidatePasswords = ['Drizzledropinn@123', 'Drizzledrop@123'];
    let fallbackSucceeded = false;

    // Try alternative hosts
    for (const altHost of candidateHosts) {
      for (const altPass of candidatePasswords) {
        try {
          console.log(`🔄 Attempting host '${altHost}' for user '${dbConfig.user}'...`);
          const altConfig = { ...dbConfig, host: altHost, password: altPass };
          const altPool = createPoolInstance(altConfig);
          connection = await altPool.getConnection();
          activePool = altPool;
          dbConfig = altConfig;
          fallbackSucceeded = true;
          console.log(`✅ Connected successfully using host '${altHost}'!`);
          break;
        } catch (altErr) {
          // Continue to next combination
        }
      }
      if (fallbackSucceeded) break;
    }

    if (!fallbackSucceeded) {
      // If on local Windows and access denied, attempt local root fallback
      if (isWindows) {
        console.log('🔄 Attempting local root credentials (root / dazzle_drop)...');
        try {
          const rootConfig = {
            host: 'localhost',
            user: 'root',
            password: process.env.LOCAL_DB_PASSWORD || 'Gopinath@10',
            database: 'dazzle_drop',
            port: 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
          };
          const rootPool = createPoolInstance(rootConfig);
          connection = await rootPool.getConnection();
          activePool = rootPool;
          dbConfig = rootConfig;
          fallbackSucceeded = true;
          console.log('✅ Connected via local root credentials!');
        } catch (rootErr) {
          console.error('❌ Local fallback also failed:', rootErr.message);
        }
      }

      if (!fallbackSucceeded) {
        console.error('❌ Database Initialization Error:', error.message);
        return;
      }
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

    // ── Seed / sync default admin accounts ────────────────────────────
    const bcrypt = require('bcryptjs');
    const defaultPassword1 = await bcrypt.hash('admin@123', 10);
    const defaultPassword2 = await bcrypt.hash('admin123', 10);

    // Primary Admin: admin12@gmail.com / admin@123
    const [admin1] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin12@gmail.com']);
    if (admin1.length === 0) {
      await connection.query(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', 'admin12@gmail.com', defaultPassword1, 'admin']
      );
      console.log('✅ Primary admin created: admin12@gmail.com / admin@123');
    } else {
      await connection.query('UPDATE users SET password = ?, role = "admin" WHERE email = ?', [defaultPassword1, 'admin12@gmail.com']);
      console.log('✅ Primary admin password verified: admin12@gmail.com / admin@123');
    }

    // Secondary Admin: admin@drizzledrop.com / admin123
    const [admin2] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@drizzledrop.com']);
    if (admin2.length === 0) {
      await connection.query(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Drizzle Admin', 'admin@drizzledrop.com', defaultPassword2, 'admin']
      );
      console.log('✅ Secondary admin created: admin@drizzledrop.com / admin123');
    } else {
      await connection.query('UPDATE users SET password = ?, role = "admin" WHERE email = ?', [defaultPassword2, 'admin@drizzledrop.com']);
      console.log('✅ Secondary admin password verified: admin@drizzledrop.com / admin123');
    }

    connection.release();
    console.log('✅ Database Tables Verified / Created Successfully');
  } catch (error) {
    console.error('❌ Database Initialization Error:', error.message);
  }
};

module.exports = { pool, initDB };
