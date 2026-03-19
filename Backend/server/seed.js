const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Settings = require('./models/Settings');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Seed: Connected to DB');

  // Create Admin
  const adminExists = await Admin.findOne({ username: 'mina' });
  if (!adminExists) {
    const admin = new Admin({ username: 'mina', password: 'password123' });
    await admin.save();
    console.log('✅ Admin "mina" created (pw: password123)');
  }

  // Create Initial Settings
  const settingsExists = await Settings.findOne();
  if (!settingsExists) {
    const settings = new Settings({ totalApartments: 10, adminEmail: process.env.ADMIN_EMAIL });
    await settings.save();
    console.log('✅ Settings initialized');
  }

  console.log('✅ Seeding completed');
  process.exit();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
