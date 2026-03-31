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
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return res.json({ reply: 'تنبيه: مفتاح الذكاء الاصطناعي GROQ_API_KEY غير موجود في إعدادات السيرفر الأونلاين.' });
    }

    // 1. Fetch available properties to give the AI some context
    let properties = [];
    let projectsData = [];
    let propertiesText = 'لا توجد عقارات أو مشاريع مسجلة حالياً في النظام.';
    
    try {
      const dbProp = await db.query('SELECT _id, title, location, price, type, category, beds, baths, size, description FROM apartments ORDER BY _id DESC LIMIT 15');
      const dbProj = await db.query('SELECT _id, title, description, status FROM projects ORDER BY _id DESC LIMIT 10');
      
      properties = dbProp.rows;
      projectsData = dbProj.rows;
      
      let lines = [];
      if (properties.length > 0) {
        lines.push('--- العقارات المتاحة ---');
        lines.push(...properties.map(p => 
          `- [${p.title}] في ${p.location} | السعر: ${p.price || 'غير محدد'} | الحجم: ${p.size || 'غير محدد'}م | ${p.beds || '0'} غرف | ${p.baths || '0'} حمامات.\nالوصف: ${p.description || 'بدون وصف'}`
        ));
      }
      
      if (projectsData.length > 0) {
        lines.push('\n--- المشاريع العقارية الكبرى ---');
        lines.push(...projectsData.map(proj => 
          `- مشروع [${proj.title}] للحجز: (الحالة: ${proj.status})\nتفاصيل المشروع: ${proj.description || 'بدون تفاصيل'}`
        ));
      }
      
      if (lines.length > 0) {
        propertiesText = lines.join('\n');
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

    // 3. Call Groq API (Lightning Fast, No Delays)
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        return res.json({ reply: 'تنبيه: مفتاح الذكاء الاصطناعي GROQ_API_KEY غير موجود في إعدادات السيرفر الأونلاين.' });
    }

    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    const aiResponse = await axios.post(groqUrl, {
      model: 'llama-3.3-70b-versatile', // الموديل الأحدث والأسرع من Groq الداعم للعربية
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (aiResponse.data && aiResponse.data.choices && aiResponse.data.choices[0].message) {
        const aiText = aiResponse.data.choices[0].message.content;
        res.json({ reply: aiText, data: (properties.slice(0, 3)) });
    } else {
        console.error('Groq error:', JSON.stringify(aiResponse.data, null, 2));
        throw new Error('لم يتم استلام رد صحيح من ذكاء Groq');
    }

  } catch (err) {
    console.error('--- Chatbot AI Error ---');
    const errorData = err?.response?.data;
    console.error('Error Details:', errorData || err.message);

    res.status(500).json({ 
      error: 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.',
      details: errorData?.error?.message || err.message
    });
  }
});

module.exports = router;
