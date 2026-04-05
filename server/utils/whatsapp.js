const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const QRCode = require('qrcode');

// أرقام الموبايلات اللي هتوصلهم الرسايل
const OWNER_PHONES = ['201279301263@s.whatsapp.net', '201203311567@s.whatsapp.net'];

// مكان حفظ الـ Session - هيتحفظ في Docker Volume
const AUTH_FOLDER = process.env.WA_AUTH_PATH || path.join(__dirname, '../data/whatsapp_auth');

let sock = null;
let isConnected = false;
let currentQR = null; // بنحفظ الـ QR الحالي عشان نعرضه في المتصفح

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    browser: ['Athar Bot', 'Chrome', '1.0.0'],
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = qr; // حفظ الـ QR عشان يتعرض في صفحة الويب
      console.log('📱 QR Code جاهز - افتح: /whatsapp-qr في المتصفح');
    }

    if (connection === 'close') {
      isConnected = false;
      currentQR = null;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️  واتساب: انقطع الاتصال. إعادة المحاولة:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(startWhatsApp, 5000);
      } else {
        console.log('❌ واتساب: تم تسجيل الخروج. احذف مجلد whatsapp_auth وأعد التشغيل.');
      }
    }

    if (connection === 'open') {
      isConnected = true;
      currentQR = null; // مش محتاجين QR بعد كده
      console.log('✅ واتساب: متصل بنجاح! الإشعارات شغالة 🚀');
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// بعت الإشعار لما حد يحجز
async function sendBookingNotification(booking) {
  if (!isConnected || !sock) {
    console.log('⚠️  واتساب: مش متصل حالياً، الرسالة اتأجلت.');
    return;
  }

  const { name, phone, apartmentTitle, projectTitle, checkIn, checkOut, price, notes } = booking;

  const message = `🔔 *حجز جديد!*

👤 *العميل:* ${name || 'غير محدد'}
📱 *التليفون:* ${phone || 'غير محدد'}
🏠 *الشقة:* ${apartmentTitle || 'غير محدد'}
🏢 *المشروع:* ${projectTitle || 'غير محدد'}
📅 *من:* ${checkIn || '-'}  ←  *إلى:* ${checkOut || '-'}
💰 *السعر:* ${price ? price + ' جنيه' : 'غير محدد'}
📝 *ملاحظات:* ${notes || 'لا يوجد'}

⏰ ${new Date().toLocaleString('ar-EG')}`;

  try {
    for (const phone of OWNER_PHONES) {
      await sock.sendMessage(phone, { text: message });
    }
    console.log('✅ تم إرسال إشعار الواتساب للأرقام المحددة بنجاح!');
  } catch (err) {
    console.error('❌ خطأ في إرسال رسالة الواتساب:', err.message);
  }
}

// دالة تعرض صفحة QR Code للمتصفح
async function getQRPage(req, res) {
  if (isConnected) {
    return res.send(`
      <!DOCTYPE html><html lang="ar" dir="rtl">
      <head><meta charset="UTF-8"><title>واتساب - متصل</title>
      <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0a0a0a;color:#fff;flex-direction:column;gap:20px;}
      .card{background:#111;border:1px solid #25D366;border-radius:16px;padding:40px;text-align:center;}
      .status{color:#25D366;font-size:24px;font-weight:bold;}
      </style></head>
      <body><div class="card">
        <div style="font-size:60px">✅</div>
        <div class="status">واتساب متصل بنجاح!</div>
        <p style="color:#999">الإشعارات شغالة أوتوماتيك على: 01279301263 و 01203311567</p>
      </div></body></html>
    `);
  }

  if (!currentQR) {
    return res.send(`
      <!DOCTYPE html><html lang="ar" dir="rtl">
      <head><meta charset="UTF-8"><title>واتساب - تحميل</title>
      <meta http-equiv="refresh" content="3">
      <style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0a0a0a;color:#fff;flex-direction:column;gap:20px;}
      </style></head>
      <body>
        <div style="font-size:50px">⏳</div>
        <p>جاري تحميل QR Code... الصفحة هتتحدث أوتوماتيك</p>
      </body></html>
    `);
  }

  // توليد QR كصورة
  const qrImage = await QRCode.toDataURL(currentQR, { width: 300, margin: 2 });

  res.send(`
    <!DOCTYPE html><html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"><title>واتساب - امسح الكود</title>
    <meta http-equiv="refresh" content="30">
    <style>
      body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#0a0a0a;color:#fff;flex-direction:column;gap:16px;margin:0;}
      .card{background:#111;border:1px solid #25D366;border-radius:20px;padding:40px;text-align:center;max-width:400px;}
      h2{color:#25D366;margin:0 0 8px 0;}
      p{color:#aaa;font-size:14px;margin:4px 0;}
      img{border:4px solid #25D366;border-radius:12px;margin:20px 0;}
      .step{background:#1a1a1a;border-radius:10px;padding:12px;margin:6px 0;text-align:right;font-size:14px;}
    </style></head>
    <body>
      <div class="card">
        <h2>📱 امسح QR Code</h2>
        <p>الصفحة بتتحدث كل 30 ثانية تلقائياً</p>
        <img src="${qrImage}" alt="WhatsApp QR Code" />
        <div class="step">1️⃣ افتح الواتساب في موبايلك</div>
        <div class="step">2️⃣ النقاط الثلاثة ⋮ ← الأجهزة المرتبطة</div>
        <div class="step">3️⃣ اضغط "ربط جهاز" وامسح الكود</div>
      </div>
    </body></html>
  `);
}

module.exports = { startWhatsApp, sendBookingNotification, getQRPage };
