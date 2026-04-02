const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db'); // Initialize DB pool/tables

const app = express();

// --- Security & Performance Middleware ---
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Compression for faster responses (if available)
try {
  const compression = require('compression');
  app.use(compression());
} catch (e) { /* optional dependency */ }

// Rate limiting to protect against abuse
try {
  const rateLimit = require('express-rate-limit');
  app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
  }));
} catch (e) { /* optional dependency */ }

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve Static Uploads with caching
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '7d',
  etag: true
}));

// Load Database Routes
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/apartments', require('./routes/apartments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/hero', require('./routes/hero'));
app.use('/api/areas', require('./routes/areas'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/settings', require('./routes/settings'));
app.use('/sitemap.xml', require('./routes/sitemap'));
app.use('/robots.txt', require('./routes/robots'));

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
