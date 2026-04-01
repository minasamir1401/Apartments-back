const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const robots = `
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://red-gate.tech/sitemap.xml

# Allow crawling of important pages
User-agent: Googlebot
Allow: /
Allow: /apartments
Allow: /projects
Allow: /rules
`.trim();

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400');
  res.send(robots);
});

module.exports = router;
