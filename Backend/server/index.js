const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
// removed duplicate path require
const db = require('./db'); // Initialize DB pool/tables

const app = express();
app.use(cors()); // Allow all for dev stability
app.use(express.json());

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Load Database Routes
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/apartments', require('./routes/apartments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hero', require('./routes/hero'));
app.use('/api/areas', require('./routes/areas'));
app.use('/sitemap.xml', require('./routes/sitemap'));

const PORT = process.env.PORT || 5000;

// Root Health Check (Crucial for Cloud Deployment)
app.get('/', (req, res) => res.send('Athar API Server Running... 🚀'));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
