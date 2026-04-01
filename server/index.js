const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
// removed duplicate path require
const axios = require('axios');
const db = require('./db'); // Initialize DB pool/tables

const app = express();
app.use(cors({ origin: true, credentials: true })); // More robust CORS for production
app.use(express.json());

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Load Database Routes
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/apartments', require('./routes/apartments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hero', require('./routes/hero'));
app.use('/api/areas', require('./routes/areas'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/sitemap.xml', require('./routes/sitemap'));

// Map Link Resolver for short URLs (maps.app.goo.gl)
app.get('/api/resolve-map', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('No URL provided');
    if (!url.includes('maps.app.goo.gl')) return res.json({ resolvedUrl: url });

    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: null,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    // axios handles redirects and provides the final URL in response.request.res.responseUrl
    // but in some envs it might be in response.config.url if followed.
    // Let's use the final URL from the request object.
    const resolvedUrl = response.request.res.responseUrl || response.config.url;
    res.json({ resolvedUrl });
  } catch (err) {
    console.error('Resolve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

// Root Health Check (Crucial for Cloud Deployment)
app.get('/', (req, res) => res.send('Athar API Server Running... 🚀'));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
