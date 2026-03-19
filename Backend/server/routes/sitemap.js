const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // 1. Static Pages
    const staticPages = ['', '/apartments', '/rules', '/status'];
    staticPages.forEach(page => {
      xml += `
      <url>
        <loc>${baseUrl}${page}</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>`;
    });

    // 2. Dynamic Apartments
    const result = await db.query('SELECT _id FROM apartments');
    result.rows.forEach(apt => {
      xml += `
      <url>
        <loc>${baseUrl}/apartments/${apt._id}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`;
    });

    xml += '</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
