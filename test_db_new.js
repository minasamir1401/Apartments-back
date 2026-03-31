const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

async function testConnection() {
  console.log('--- Testing PostgreSQL Connection ---');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded (masked)' : 'Not Found');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('red-gate') ? false : { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ Connection Successful! DB Time:', res.rows[0].now);
    
    const tableRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('📋 Existing Tables:', tableRes.rows.map(r => r.table_name).join(', ') || 'None');
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
