const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET all
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM projects ORDER BY id DESC';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM projects WHERE _id = $1', [req.params.id]);
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
    const { title, title_en, description, description_en, images, main_image, details, details_en, unit_types, location, location_en, status, map_link } = req.body;

    const query = `
      INSERT INTO projects (
        _id, title, title_en, description, description_en, images, main_image, details, details_en, unit_types, location, location_en, status, map_link
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const values = [
      _id, title, title_en, description, description_en,
      JSON.stringify(images || []),
      main_image || '',
      details || '',
      details_en || '',
      JSON.stringify(unit_types || []),
      location || '',
      location_en || '',
      status || 'active',
      map_link || ''
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { title, title_en, description, description_en, images, main_image, details, details_en, unit_types, location, location_en, status, map_link } = req.body;

    const query = `
      UPDATE projects 
      SET title = $1, title_en = $2, description = $3, description_en = $4,
          images = $5, main_image = $6, details = $7, details_en = $8,
          unit_types = $9, location = $10, location_en = $11, status = $12, map_link = $13
      WHERE _id = $14 OR CAST(id AS TEXT) = $14
      RETURNING *
    `;
    const values = [
      title, title_en, description, description_en,
      JSON.stringify(images), main_image, details, details_en,
      JSON.stringify(unit_types || []), location, location_en, status, map_link, req.params.id
    ];

    const result = await db.query(query, values);
    if (result.rows[0]) res.json(result.rows[0]);
    else res.status(404).json({ message: 'not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM projects WHERE _id = $1 OR CAST(id AS TEXT) = $1 RETURNING *', [req.params.id]);
    if (result.rows[0]) res.json({ message: 'deleted' });
    else res.status(404).json({ message: 'not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
