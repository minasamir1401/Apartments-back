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
    let properties = [];
    let propertiesText = 'لا توجد عقارات مسجلة حالياً في النظام.';
    
    try {
      const result = await db.query('SELECT _id, title, location, price, type, category FROM apartments ORDER BY _id DESC LIMIT 15');
      properties = result.rows;
      
      if (properties.length > 0) {
        propertiesText = properties.map(p => 
          `العقار: ${p.title} في ${p.location} (السعر: ${p.price || 'غير محدد'}، النوع: ${p.type} للتصنيف: ${p.category}، ID الخاص به للرابط: ${p._id})`
        ).join('\n');
      }
    } catch (dbErr) {
      console.warn('⚠️ Warning: Could not fetch properties from DB, using AI without context.');
    }

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

    // 3. Call ApiFreeLLM API
    const apiKey = process.env.APIFREELLM_KEY;
    
    if (!apiKey) {
      return res.json({ 
        reply: 'أهلاً بك! (ملاحظة: يرجى إضافة APIFREELLM_KEY في ملف .env).',
        data: properties.slice(0,3) 
      });
    }

    const apiUrl = 'https://apifreellm.com/api/v1/chat';
    
    const apiResponse = await axios.post(apiUrl, {
      message: systemPrompt + '\n\nرسالة العميل: ' + message
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (apiResponse.data && apiResponse.data.response) {
        const aiText = apiResponse.data.response;
        res.json({ reply: aiText, data: properties.slice(0, 3) });
    } else {
        console.error('ApiFreeLLM error:', JSON.stringify(apiResponse.data, null, 2));
        throw new Error('لم يتم استلام رد صحيح من ذكاء ApiFreeLLM');
    }

  } catch (err) {
    console.error('--- Chatbot AI Error ---');
    console.error('Error Details:', err?.response?.data || err.message);
    res.status(500).json({ 
      error: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.',
      details: err?.response?.data?.error?.message || err.message
    });
  }
});

module.exports = router;
