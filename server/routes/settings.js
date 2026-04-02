const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// GET settings
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM site_settings ORDER BY id DESC LIMIT 1');
    res.json(result.rows[0] || { show_filters: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings
router.patch('/', verifyToken, async (req, res) => {
  try {
    const { show_filters } = req.body;
    
    // Check if exists
    const check = await db.query('SELECT id FROM site_settings LIMIT 1');
    if (check.rows.length > 0) {
      const result = await db.query(
        'UPDATE site_settings SET show_filters = $1, updatedAt = NOW() WHERE id = $2 RETURNING *',
        [show_filters, check.rows[0].id]
      );
      res.json(result.rows[0]);
    } else {
      const result = await db.query(
        'INSERT INTO site_settings (show_filters) VALUES ($1) RETURNING *',
        [show_filters]
      );
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
