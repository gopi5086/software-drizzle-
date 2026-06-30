const { pool } = require('./config/db');

async function run() {
  try {
    await pool.query('ALTER TABLE reservations ADD COLUMN check_in_time VARCHAR(50) DEFAULT "12:00 Noon"');
    await pool.query('ALTER TABLE reservations ADD COLUMN check_out_time VARCHAR(50) DEFAULT "11:00 A.M"');
    console.log('✅ Columns check_in_time and check_out_time added successfully');
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
  } finally {
    process.exit(0);
  }
}

run();
