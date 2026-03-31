const axios = require('axios');
const apiKey = 'apf_xsuukak3i8667v8bcj4sx4wf';
const apiUrl = 'https://apifreellm.com/api/v1/chat';

async function testApiFreeLLM() {
  console.log('--- Testing ApiFreeLLM Connection ---');
  try {
    const res = await axios.post(apiUrl, {
      message: 'قولي نكتة قصيرة باللهجة المصرية'
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.data && res.data.message) {
      console.log('✅ Connection Success!');
      console.log('🤖 AI Response:', res.data.message);
    } else {
      console.log('❌ Unexpected Response structure:', res.data);
    }
  } catch (err) {
    console.error('❌ ApiFreeLLM Connection Failed:', err?.response?.data || err.message);
  }
}

testApiFreeLLM();
