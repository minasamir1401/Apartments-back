const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  title_en: { type: String },
  description: { type: String },
  description_en: { type: String },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  location_en: { type: String },
  beds: { type: Number, default: 1 },
  size: { type: String },
  images: [{ type: String }],
  amenities: [{
    id: String,
    label: String,
    iconName: String, // e.g., 'Wifi', 'Wind'
    enabled: { type: Boolean, default: false }
  }],
  type: { type: String, enum: ['apartment', 'villa', 'twinhouse', 'commercial'], default: 'apartment' },
  category: { type: String, enum: ['buy', 'rent'], default: 'buy' },
  rules: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Apartment', apartmentSchema);
