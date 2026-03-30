const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  apartmentTitle: { type: String, required: true }, // New Field
  apartmentId: { type: String }, // New Field
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  price: { type: Number, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'partially_paid'], 
    default: 'unpaid' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
