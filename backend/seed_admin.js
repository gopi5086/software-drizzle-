const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  try {
    await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Test Admin', 'admin@drizzledrop.com', hashedPassword, 'admin']
    );
    console.log('Admin user created: admin@drizzledrop.com / admin123');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('Admin user already exists');
    } else {
      console.error(err);
    }
  } finally {
    process.exit();
  }
}

createAdmin();
