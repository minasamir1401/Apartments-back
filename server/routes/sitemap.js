const express = require('express');
const router = express.Router();
const db = require('../db');

const DOMAIN = 'https://red-gate.tech';

router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

    // 1. Static Pages
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/apartments', priority: '0.9', changefreq: 'daily' },
      { url: '/projects', priority: '0.9', changefreq: 'daily' },
      { url: '/rules', priority: '0.4', changefreq: 'monthly' },
      { url: '/status', priority: '0.3', changefreq: 'monthly' },
    ];
    staticPages.forEach(({ url, priority, changefreq }) => {
      xml += `
      <url>
        <loc>${DOMAIN}${url}</loc>
        <lastmod>${today}</lastmod>
        <changefreq>${changefreq}</changefreq>
        <priority>${priority}</priority>
        <xhtml:link rel="alternate" hreflang="ar" href="${DOMAIN}${url}"/>
        <xhtml:link rel="alternate" hreflang="en" href="${DOMAIN}${url}"/>
      </url>`;
    });

    // 2. Dynamic Apartments
    const aptResult = await db.query('SELECT _id, title, title_en, location, "createdat" FROM apartments ORDER BY id DESC');
    aptResult.rows.forEach(apt => {
      const createdAt = apt.createdat ? new Date(apt.createdat).toISOString().split('T')[0] : today;
      xml += `
      <url>
        <loc>${DOMAIN}/apartments/${apt._id}</loc>
        <lastmod>${createdAt}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`;
    });

    // 3. Dynamic Projects
    const projResult = await db.query('SELECT _id, title, title_en, "createdat" FROM projects ORDER BY id DESC');
    projResult.rows.forEach(proj => {
      const createdAt = proj.createdat ? new Date(proj.createdat).toISOString().split('T')[0] : today;
      xml += `
      <url>
        <loc>${DOMAIN}/projects/${proj._id}</loc>
        <lastmod>${createdAt}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`;
    });

    xml += '</urlset>';
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
