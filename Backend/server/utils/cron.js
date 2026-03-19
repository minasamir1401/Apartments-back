const cron = require('node-cron');
const Booking = require('../models/Booking');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Runs every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily reminder cron job...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const plusOneDay = new Date(tomorrow);
  plusOneDay.setDate(plusOneDay.getDate() + 1);

  try {
    const checkIns = await Booking.find({
      checkIn: { $gte: tomorrow, $lt: plusOneDay },
      status: 'approved'
    });

    const checkOuts = await Booking.find({
      checkOut: { $gte: tomorrow, $lt: plusOneDay },
      status: 'approved'
    });

    if (checkIns.length > 0 || checkOuts.length > 0) {
      const emailContent = `
        تقرير الحجوزات لغدٍ (${tomorrow.toLocaleDateString('ar-EG')}):
        
        🏠 القادمون الجدد (${checkIns.length}):
        ${checkIns.map(b => `- ${b.name} (${b.phone})`).join('\n')}
        
        🔑 المغادرون (${checkOuts.length}):
        ${checkOuts.map(b => `- ${b.name} (${b.phone})`).join('\n')}
      `;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: '📅 تنبيه حجوزات الغد',
        text: emailContent
      });
      console.log('Daily report sent.');
    }
  } catch (error) {
    console.error('Cron Error:', error);
  }
});
