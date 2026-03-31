const axios = require('axios');
const apiKey = 'apf_xsuukak3i8667v8bcj4sx4wf';
const apiUrl = 'https://apifreellm.com/api/v1/chat';

async function testRateLimit() {
  console.log('Sending Request 1...');
  try {
    await axios.post(apiUrl, { message: 'hello 1' }, { headers: { Authorization: `Bearer ${apiKey}` } });
    console.log('Request 1 Success!');
  } catch (e) {
    console.log('Request 1 failed:', e?.response?.data || e.message);
  }

  console.log('Sending Request 2 immediately (to trigger rate limit)...');
  try {
    const res2 = await axios.post(apiUrl, { message: 'hello 2' }, { headers: { Authorization: `Bearer ${apiKey}` } });
    console.log('Request 2 Success:', res2.data);
  } catch (err) {
    console.log('--- RATE LIMIT ERROR STRUCTURE ---');
    console.log('Status Code:', err?.response?.status);
    console.log('Error Data:', JSON.stringify(err?.response?.data, null, 2));
  }
}

testRateLimit();
