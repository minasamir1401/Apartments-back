const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const verifyToken = require('../middleware/auth');

// Multer Config for Image Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Upload endpoint
router.post('/upload', verifyToken, upload.array('images', 1000), (req, res) => {
  const files = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ urls: files });
});

// GET all with filters
router.get('/', async (req, res) => {
  try {
    const { search, type, category } = req.query;
    let query = 'SELECT *, pricetype AS "priceType" FROM apartments WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR location ILIKE $${params.length} OR title_en ILIKE $${params.length} OR location_en ILIKE $${params.length})`;
    }
    if (type && type !== 'all') {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    if (category && category !== 'all') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY id DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT *, pricetype AS "priceType" FROM apartments WHERE _id = $1', [req.params.id]);
    if (result.rows[0]) res.json(result.rows[0]);
    else res.status(404).json({ message: 'not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', verifyToken, async (req, res) => {
  try {
    const _id = Date.now().toString();
    const {
      title, title_en, price, priceType, location, location_en,
      beds, baths, size, description, description_en, images, amenities, rules,
      type, category, map_link
    } = req.body;

    const query = `
      INSERT INTO apartments (
        _id, title, title_en, price, pricetype, location, location_en, 
        beds, baths, size, description, description_en, images, amenities, rules,
        type, category, map_link
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    const values = [
      _id, title, title_en, price, priceType, location, location_en,
      beds, baths, size, description, description_en,
      JSON.stringify(images || []),
      JSON.stringify(amenities || []),
      JSON.stringify(rules || []),
      type || 'apartment',
      category || 'buy',
      map_link || ''
    ];

    const result = await db.query(query, values);
    const finalRes = await db.query('SELECT *, pricetype AS "priceType" FROM apartments WHERE _id = $1', [_id]);
    res.status(201).json(finalRes.rows[0]);
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH update
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const {
      title, title_en, price, priceType, location, location_en,
      beds, baths, size, description, description_en, images, amenities, rules,
      type, category, map_link
    } = req.body;

    const query = `
      UPDATE apartments 
      SET title = $1, title_en = $2, price = $3, pricetype = $4, location = $5, location_en = $6, 
          beds = $7, baths = $8, size = $9, description = $10, description_en = $11,
          images = $12, amenities = $13, rules = $14,
          type = $15, category = $16, map_link = $17
      WHERE _id = $18
      RETURNING *
    `;
    const values = [
      title, title_en, price, priceType, location, location_en,
      beds, baths, size, description, description_en,
      JSON.stringify(images),
      JSON.stringify(amenities),
      JSON.stringify(rules),
      type, category,
      map_link,
      req.params.id
    ];

    const result = await db.query(query, values);
    if (result.rows[0]) {
      const finalRes = await db.query('SELECT *, pricetype AS "priceType" FROM apartments WHERE _id = $1', [req.params.id]);
      res.json(finalRes.rows[0]);
    } else res.status(404).json({ message: 'not found' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await db.query('DELETE FROM apartments WHERE _id = $1', [req.params.id]);
    res.json({ message: 'deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
