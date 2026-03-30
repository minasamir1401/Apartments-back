const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  totalApartments: { type: Number, default: 10 },
  adminEmail: { type: String, required: true }
});

module.exports = mongoose.model('Settings', settingsSchema);
