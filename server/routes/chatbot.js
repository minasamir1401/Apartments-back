const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.json({ reply: 'مرحباً بك في ريد غيت! كيف يمكنني مساعدتك اليوم؟' });
    }

    // 1. Fetch available properties to give the AI some context
    // You might want to limit this or filter based on a pre-search, but for <50 properties it fits perfectly in context!
    const result = await db.query('SELECT _id, title, location, price, type, category FROM apartments ORDER BY _id DESC LIMIT 15');
    const properties = result.rows;
    
    // Create a readable list for the AI
    const propertiesText = properties.map(p => 
      `العقار: ${p.title} في ${p.location} (السعر: ${p.price || 'غير محدد'}، النوع: ${p.type} للتصنيف: ${p.category}، ID الخاص به للرابط: ${p._id})`
    ).join('\n');

    // 2. Setup AI Prompt
    const systemPrompt = `
أنت المساعد الذكي والمتحضر لشركة "ريد غيت" (Red Gate) للعقارات الفاخرة في مصر.
مهمتك هي التحدث مع العملاء بود، احترافية، ولهجة مصرية راقية أو عربية فصحى واضحة.
لديك حالياً هذه القائمة من أحدث العقارات المتاحة لدينا في النظام:
${propertiesText}

قواعد الرد:
1. كن ودوداً ورحب بالعميل إذا كان يلقي التحية.
2. إذا سأل العميل عن عقار في مكان معين أو بسعر معين، ابحث في القائمة المعطاة لك أعلاه، واقترح عليه العقار المناسب مع ذكر السعر والمكان بشكل جذاب.
3. إذا لم تجد شيئاً مناسباً في القائمة، أخبره بلطف أننا سنبحث عن طلبه، وشجعه على ترك رقم هاتفه ليتواصل معه أحد وكلائنا.
4. لا تخترع عقارات غير موجودة في القائمة أبداً!
5. إجابتك يجب أن تكون فقط هي الرسالة الموجهة للعميل (بدون أي مقدمات لك أو رسائل برمجية).
    `;

    // 3. Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // Fallback to old behavior if no API Key is set yet
      return res.json({ 
        reply: 'أهلاً بك! (ملاحظة للنظام: يرجى إضافة GEMINI_API_KEY في ملف .env ليتمكن الذكاء الاصطناعي من التحدث بشكل ذكي وحر).',
        data: properties.slice(0,3) 
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const aiResponse = await axios.post(geminiUrl, {
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\nرسالة العميل: ' + message }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const aiText = aiResponse.data.candidates[0].content.parts[0].text;

    // Send the intelligent reply back to the user
    // We can also send the top 3 properties visually in the 'data' array so the front-end renders them as cards!
    res.json({ reply: aiText, data: properties.slice(0, 3) });

  } catch (err) {
    console.error('Chatbot AI error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.' });
  }
});

module.exports = router;
