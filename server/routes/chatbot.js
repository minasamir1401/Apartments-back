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
      const dbProj = await db.query('SELECT _id, title, description, status, unit_types FROM projects ORDER BY _id DESC LIMIT 10');
      
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
        lines.push(...projectsData.map(proj => {
          let projectStr = `- مشروع [${proj.title}] للحجز: (الحالة: ${proj.status})\nتفاصيل المشروع: ${proj.description || 'بدون تفاصيل'}`;
          try {
            const units = typeof proj.unit_types === 'string' ? JSON.parse(proj.unit_types) : proj.unit_types;
            if (units && Array.isArray(units) && units.length > 0) {
              projectStr += '\nالوحدات والأسعار المتاحة في المشروع: ';
              projectStr += units.map(u => `النوع: ${u.title || '?'}، المساحة: ${u.size || '?'}، السعر: ${u.price || '?'}`).join(' | ');
            }
          } catch(e) {}
          return projectStr;
        }));
      }
      
      if (lines.length > 0) {
        propertiesText = lines.join('\n');
      }
    } catch (dbErr) {
      console.warn('⚠️ Warning: Could not fetch properties from DB, using AI without context.');
    }

    // 2. Setup AI Prompt
    const systemPrompt = `
أنت المساعد الذكي لشركة "ريد غيت" (Red Gate) للعقارات الفاخرة في مصر.
مهمتك هي التحدث مع العملاء بلهجة مصرية راقية، ودودة، وطبيعية جداً (كأنك وكيل عقاري حقيقي يتحدث مع صديق أو عميل مهم).
لديك حالياً هذه القائمة من العقارات والمشاريع المتاحة لدينا:
${propertiesText}

قواعد الرد:
1. تجنب تماماً الصيغ الرسمية الجامدة أو الاعتذارات المتكررة مثل "آسف جداً" أو "لا يوجد لدينا".
2. إذا العميل سأل عن حاجة مش موجودة بنفس السعر أو المواصفات، رد عليه بشكل طبيعي وذكي، مثلاً: "يا هلا بك، بالنسبة لمشروع ريفا حالياً المتاح فيه بميزانية قريبة هو كذا..." أو "خليني أشوف لك المتاح.. حالياً عندنا كذا وكذا ممكن يعجبوك".
3. خليك عملي ومبادر؛ اقترح البدائل المتاحة فوراً القريبة من طلبه من القائمة المعطاة لك.
4. شجع العميل بذكاء إنه يسيب رقم تليفونه عشان وكيل من عندنا يكلمه ويساعده يوصل لأحسن عرض، خصوصاً لو طلبه مش مطابق بالظبط للي في القائمة.
5. لا تخترع عقارات غير موجودة في القائمة، بس تقدر تقول "هنشوف لك عروض تانية" أو "هندور لك في المتاح عندنا بمجرد ما تواصلنا".
6. إجابتك لازم تكون هي الرسالة الموجهة للعميل فقط، بأسلوب "شيك" ومصري راقي.
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
