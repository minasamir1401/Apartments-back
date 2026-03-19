const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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
      "ALTER TABLE bookings ALTER COLUMN price TYPE TEXT USING (price::text)"
    ];

    for (const sql of migrations) {
      try {
        await pool.query(sql);
      } catch (e) {
        console.warn('⚠️ Migration warning (might already exist):', sql);
      }
    }

    // 3. SEED DEFAULT DATA
    const heroCheck = await pool.query('SELECT COUNT(*) FROM hero_settings');
    if (parseInt(heroCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO hero_settings (title, subtitle, highlight, image, button_text, button_link)
        VALUES ('RED GATE LUXURY', 'Distinctive Quality Residences', 'RED GATE', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000', 'استعراض الوحدات', '/apartments')
      `);
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
      return await pool.query(text, params);
    } catch (err) {
      console.error('❌ Database Query Error:', err.message);
      console.error('   SQL:', text);
      throw err;
    }
  },
};
