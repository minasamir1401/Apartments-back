const db = require('./server/db');
async function test() {
  try {
    console.log('Testing exact query...');
    const res = await db.query('SELECT * FROM bookings ORDER BY createdAt DESC');
    console.log('Success!', res.rows.length, 'bookings found.');
    process.exit(0);
  } catch (err) {
    console.error('Query Failed:', err);
    process.exit(1);
  }
}
test();
