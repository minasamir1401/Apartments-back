const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Pool } = require('pg');

// Use SSL only for external cloud DBs (Neon, Supabase), not for internal Dokploy PostgreSQL
const isExternalDb = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('neon.tech') ||
  process.env.DATABASE_URL.includes('supabase') ||
  process.env.DATABASE_URL.includes('render.com') ||
  process.env.SSL_MODE === 'true'
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isExternalDb ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('🐘 Connected to Neon PostgreSQL');
});

const initDb = async () => {
  try {
    // 1. CREATE TABLES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS apartments (
        id SERIAL PRIMARY KEY,
        _id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        price NUMERIC NOT NULL,
        pricetype TEXT DEFAULT 'daily',
        location TEXT,
        beds TEXT,
        size TEXT,
        description TEXT,
        images JSONB DEFAULT '[]',
        amenities JSONB DEFAULT '[]',
        rules JSONB DEFAULT '[]',
        createdAt TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add missing columns to apartments table if they were created before we added english support and types
    try {
      await pool.query(`ALTER TABLE apartments ADD COLUMN IF NOT EXISTS title_en TEXT`);
      await pool.query(`ALTER TABLE apartments ADD COLUMN IF NOT EXISTS location_en TEXT`);
      await pool.query(`ALTER TABLE apartments ADD COLUMN IF NOT EXISTS description_en TEXT`);
      await pool.query(`ALTER TABLE apartments ADD COLUMN IF NOT EXISTS baths TEXT`);
      await pool.query(`ALTER TABLE apartments ADD COLUMN IF NOT EXISTS type TEXT`);
      await pool.query(`ALTER TABLE apartments ADD COLUMN IF NOT EXISTS category TEXT`);
    } catch (colErr) {
      console.warn('Silent skip alter apartments cols:', colErr.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS areas (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        name_en TEXT,
        image TEXT,
        count TEXT,
        count_en TEXT,
        display_order INTEGER DEFAULT 0,
        createdAt TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        _id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        checkIn TIMESTAMPTZ,
        checkOut TIMESTAMPTZ,
        notes TEXT,
        apartmentTitle TEXT,
        price TEXT,
        apartmentId TEXT,
        project_id TEXT,
        project_title TEXT,
        createdAt TIMESTAMPTZ DEFAULT NOW(),
        status TEXT DEFAULT 'pending'
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        _id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        title_en TEXT,
        description TEXT,
        description_en TEXT,
        images JSONB DEFAULT '[]',
        main_image TEXT,
        status TEXT DEFAULT 'active',
        createdAt TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);


    await pool.query(`
      CREATE TABLE IF NOT EXISTS hero_settings (
        id SERIAL PRIMARY KEY,
        title TEXT DEFAULT 'RED GATE LUXURY',
        subtitle TEXT DEFAULT 'Distinctive Quality Residences',
        highlight TEXT DEFAULT 'RED GATE',
        image TEXT DEFAULT 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000',
        button_text TEXT DEFAULT 'استعراض الوحدات',
        button_link TEXT DEFAULT '/apartments'
      )
    `);

    // 2. MIGRATIONS
    const migrations = [
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS pricetype TEXT DEFAULT 'daily'",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'apartment'",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'buy'",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS title_en TEXT",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS location_en TEXT",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS description_en TEXT",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS baths TEXT",
      "ALTER TABLE hero_settings ADD COLUMN IF NOT EXISTS button_link TEXT DEFAULT '/apartments'",
      "ALTER TABLE hero_settings ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS main_image TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS details TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS details_en TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS unit_types JSONB DEFAULT '[]'",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS location_en TEXT",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS project_id TEXT",
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS project_title TEXT",
      "ALTER TABLE bookings ALTER COLUMN price TYPE TEXT USING (price::text)",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS map_link TEXT",
      "ALTER TABLE projects ADD COLUMN IF NOT EXISTS map_link TEXT",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS unit_types JSONB DEFAULT '[]'",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS details TEXT",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS details_en TEXT",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS project_id TEXT",
      "ALTER TABLE apartments ADD COLUMN IF NOT EXISTS project_title TEXT",
      "CREATE TABLE IF NOT EXISTS site_settings (id SERIAL PRIMARY KEY, show_filters BOOLEAN DEFAULT TRUE, updatedAt TIMESTAMPTZ DEFAULT NOW())",
      // Performance indexes
      "CREATE INDEX IF NOT EXISTS idx_apartments_id ON apartments(_id)",
      "CREATE INDEX IF NOT EXISTS idx_apartments_category ON apartments(category)",
      "CREATE INDEX IF NOT EXISTS idx_apartments_location ON apartments(location)",
      "CREATE INDEX IF NOT EXISTS idx_apartments_type ON apartments(type)",
      "CREATE INDEX IF NOT EXISTS idx_projects_id ON projects(_id)",
      "CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone)",
      "CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)"
    ];

    for (const sql of migrations) {
      try {
        await pool.query(sql);
      } catch (e) {
        console.warn('⚠️ Migration warning (might already exist):', sql);
      }
    }

    // 3. SEED DEFAULT DATA
    const settingsCheck = await pool.query('SELECT COUNT(*) FROM site_settings');
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      await pool.query('INSERT INTO site_settings (show_filters) VALUES (true)');
    }
    const heroCheck = await pool.query('SELECT COUNT(*) FROM hero_settings');
    if (parseInt(heroCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO hero_settings (title, subtitle, highlight, image, button_text, button_link)
        VALUES ('RED GATE LUXURY', 'Distinctive Quality Residences', 'RED GATE', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000', 'استعراض الوحدات', '/apartments')
      `);
    }

    const adminCheck = await pool.query('SELECT COUNT(*) FROM admins');
    if (parseInt(adminCheck.rows[0].count) === 0) {
      // Default: admin / mina2024
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash('mina2024', 10);
      await pool.query('INSERT INTO admins (username, password) VALUES ($1, $2)', ['admin', hashed]);
      console.log('👤 Default admin created');
    }

    console.log('✅ Tables and migrations initialized successfully');
  } catch (err) {
    console.error('❌ Critical Error initializing database:', err);
  }
};

initDb();

module.exports = {
  query: async (text, params) => {
    try {
      if (!pool) throw new Error('Database pool not initialized');
      return await pool.query(text, params);
    } catch (err) {
      console.error('❌ Database Query Error:', err.message);
      // We MUST throw the error so the API endpoints know it failed and can respond with 500
      throw err;
    }
  },
};
