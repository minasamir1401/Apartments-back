const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Configure Multer for Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Get ALL Hero slides
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM hero_settings ORDER BY display_order ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Hero Get error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create NEW slide
router.post('/', upload.single('imageFile'), async (req, res) => {
  const { title, subtitle, highlight, button_text, button_link, display_order } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000';

  try {
    const result = await db.query(
      `INSERT INTO hero_settings (title, subtitle, highlight, image, button_text, button_link, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, subtitle, highlight, image, button_text, button_link, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Hero Create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update EXISTING slide
router.put('/:id', upload.single('imageFile'), async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, highlight, button_text, button_link, display_order, image } = req.body;

  let finalImage = image;
  if (req.file) {
    finalImage = `/uploads/${req.file.filename}`;
  }

  try {
    const result = await db.query(
      `UPDATE hero_settings 
       SET title = $1, subtitle = $2, highlight = $3, image = $4, button_text = $5, button_link = $6, display_order = $7
       WHERE id = $8
       RETURNING *`,
      [title, subtitle, highlight, finalImage, button_text, button_link, display_order || 0, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Hero Update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete slide
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM hero_settings WHERE id = $1', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('❌ Hero Delete error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
