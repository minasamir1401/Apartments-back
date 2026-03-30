const express = require('express');
const router = express.Router();
const db = require('../db');

// POST create
router.post('/', async (req, res) => {
  try {
    const { name, phone, checkIn, checkOut, notes, apartmentTitle, price, apartmentId, projectId, projectTitle } = req.body;
    const _id = Date.now().toString();

    const query = `
      INSERT INTO bookings (_id, name, phone, checkIn, checkOut, notes, apartmentTitle, price, apartmentId, project_id, project_title, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      _id, 
      name, 
      phone, 
      checkIn || null, 
      checkOut || null, 
      notes || '', 
      apartmentTitle || null, 
      price || null, 
      apartmentId || null, 
      projectId || null, 
      projectTitle || null, 
      'pending'
    ];

    const result = await db.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('❌ POST Booking Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM bookings ORDER BY createdAt DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ POST Booking Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH update
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db.query(
      'UPDATE bookings SET status = $1 WHERE _id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows[0]) res.json(result.rows[0]);
    else res.status(404).json({ message: 'not found' });
  } catch (err) {
    console.error('❌ POST Booking Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM bookings WHERE _id = $1', [req.params.id]);
    res.json({ message: 'deleted' });
  } catch (err) {
    console.error('❌ POST Booking Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
