const axios = require('axios');
const apiKey = 'AIzaSyC1ginQDPzXMN-cddhp5Jf6l-6YCnjxikg';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
  console.log('--- Listing Available Gemini Models ---');
  try {
    const res = await axios.get(url);
    const models = res.data.models.map(m => m.name);
    console.log('✅ Models Found:', models.join(', '));
  } catch (err) {
    console.error('❌ Failed to list models:', err?.response?.data || err.message);
  }
}

listModels();
