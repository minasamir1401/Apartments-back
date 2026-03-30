const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.json({ reply: 'مرحباً بك! ما هو المكان الذي تبحث عن عقار فيه، وما هي ميزانيتك التقريبية؟' });
    }

    const text = message.toLowerCase();
    
    // Extract price (look for numbers)
    const numbers = text.match(/\d+/g);
    let maxPrice = null;
    if (numbers && numbers.length > 0) {
      // Find the largest number as max price, assuming price in millions or thousands
      maxPrice = Math.max(...numbers.map(Number));
    }

    // Attempt to match location (simple keywords from common areas)
    // We can just query the database with keywords from the message!
    // Since we don't have a complex NLP, we can just do a text search on the location or title.
    const words = text.split(/\s+/).filter(w => w.length > 2); // basic words
    
    let query = 'SELECT _id, title, location, price, images FROM apartments WHERE 1=1';
    const params = [];

    // Simple Location matching
    // Filter words that look like numbers or currency
    const searchWords = words.filter(w => isNaN(w) && !['جنيه', 'الف', 'مليون', 'دولار', 'سعر', 'ميزانية', 'في', 'عايز', 'اريد', 'بكام', 'مكان'].includes(w));
    
    if (searchWords.length > 0) {
      const searchConditions = searchWords.map((word, i) => {
        params.push(`%${word}%`);
        return `(location ILIKE $${params.length} OR location_en ILIKE $${params.length} OR title ILIKE $${params.length} OR title_en ILIKE $${params.length})`;
      });
      query += ` AND (${searchConditions.join(' OR ')})`;
    }

    if (maxPrice) {
      // Assuming price in db might be stored as numeric or string
      // Just a simple comparison if possible, or omit if strictly string
      // Many times price is string in old versions, but let's cast or compare.
      // Wait, let's look at how price is stored.
    }

    query += ' LIMIT 3';
    
    const result = await db.query(query, params);
    const properties = result.rows;

    let responseText = 'بناءً على طلبك، ';
    if (properties.length > 0) {
      responseText += 'إليك بعض الترشيحات المناسبة:\n';
      properties.forEach(p => {
        const priceStr = p.price ? ` - السعر: ${p.price}` : '';
        responseText += `- ${p.title} في ${p.location}${priceStr}\n`;
      });
      responseText += '\nهل تود رؤية المزيد أو تعديل البحث؟';
    } else {
      responseText = 'عذراً، لم أجد عقارات تطابق بحثك تماماً. هل يمكنك توضيح المكان المفضل لك أو تعديل الميزانية؟';
    }

    res.json({ reply: responseText, data: properties });

  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة طلبك.' });
  }
});

module.exports = router;
