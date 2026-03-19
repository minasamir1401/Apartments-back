const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all areas
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM areas ORDER BY display_order ASC, id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create area
router.post('/', async (req, res) => {
  try {
    const { name, name_en, image, count, count_en, display_order } = req.body;
    const query = `
      INSERT INTO areas (name, name_en, image, count, count_en, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [name, name_en, image, count, count_en, display_order || 0];
    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update area
router.patch('/:id', async (req, res) => {
  try {
    const { name, name_en, image, count, count_en, display_order } = req.body;
    const query = `
      UPDATE areas 
      SET name = $1, name_en = $2, image = $3, count = $4, count_en = $5, display_order = $6
      WHERE id = $7
      RETURNING *
    `;
    const values = [name, name_en, image, count, count_en, display_order, req.params.id];
    const result = await db.query(query, values);
    if (result.rows[0]) res.json(result.rows[0]);
    else res.status(404).json({ message: 'not found' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete area
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM areas WHERE id = $1', [req.params.id]);
    res.json({ message: 'Area deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
