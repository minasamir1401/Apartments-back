const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

const apiKey = 'AIzaSyC1ginQDPzXMN-cddhp5Jf6l-6YCnjxikg';
const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

async function testGemini() {
  console.log('--- Testing Gemini API Key ---');
  try {
    const aiResponse = await axios.post(geminiUrl, {
      contents: [{ role: 'user', parts: [{ text: 'قل مرحباً بالعربية' }] }]
    });
    console.log('✅ Gemini Success! Response:', aiResponse.data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error('❌ Gemini Failed:', err?.response?.data || err.message);
  }
}

testGemini();
