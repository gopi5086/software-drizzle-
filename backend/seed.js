const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    
    // Check if admin already exists
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin12@gmail.com']);
    
    if (rows.length === 0) {
      await pool.query(
        'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Hari (Admin)', 'admin12@gmail.com', hashedPassword, 'admin']
      );
      console.log('✅ Admin user seeded: Hari (Admin) / admin@123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

seed();
