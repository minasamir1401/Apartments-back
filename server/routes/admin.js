const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const verifyToken = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'mina_secret_key_2024';

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: admin.username });
  } catch (err) {
    console.error('❌ Login Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Change Password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { username } = req.user;

    const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور القديمة غير صحيحة' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE admins SET password = $1 WHERE username = $2', [hashed, username]);
    
    res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (err) {
    console.error('❌ Change Password Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Stats (Protected)
router.get('/stats', verifyToken, async (req, res) => {
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
      .filter(b => new Date(b.createdAt) >= firstDay)
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
