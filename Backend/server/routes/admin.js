const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'mina2024';
const JWT_SECRET = process.env.JWT_SECRET || 'mina_secret_key_2024';

// Admin Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, username });
  }
  return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});

// Stats
router.get('/stats', async (req, res) => {
  try {
    const bookingsResult = await db.query('SELECT * FROM bookings');
    const bookings = bookingsResult.rows;
    
    const approved = bookings.filter(b => b.status === 'approved');
    const pending = bookings.filter(b => b.status === 'pending');
    const rejected = bookings.filter(b => b.status === 'rejected');
    
    const totalIncome = approved.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    const expectedIncome = [...approved, ...pending].reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyIncome = approved
      .filter(b => new Date(b.checkin) >= firstDay)
      .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    res.json({
      totalBookings: bookings.length,
      totalIncome,
      expectedIncome,
      monthlyIncome,
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length
    });
  } catch (err) {
    console.error('❌ Stats Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
