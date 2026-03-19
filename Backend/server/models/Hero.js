const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
  title: { type: String, default: 'MINA LUXURY' },
  subtitle: { type: String, default: 'Distinctive Quality Residences' },
  highlight: { type: String, default: 'LUXURY' },
  image: { type: String, default: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000' },
  buttonText: { type: String, default: 'استعراض الوحدات' }
}, { timestamps: true });

module.exports = mongoose.model('Hero', heroSchema);
