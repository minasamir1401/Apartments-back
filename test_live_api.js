const axios = require('axios');
const url = 'https://ratgate-api.red-gate.tech/api/chatbot';

async function testLiveApi() {
  console.log('--- Testing LIVE Production API ---');
  try {
    const res = await axios.post(url, {
      message: "كلمني عن الشركه"
    });
    console.log('✅ Response Received!');
    console.log('🤖 Bot Says:', res.data.reply);
  } catch (err) {
    console.error('❌ API Error:', err?.response?.status || 'Network Error');
    console.error('Details:', err?.response?.data || err.message);
  }
}

testLiveApi();
