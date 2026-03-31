const axios = require('axios');
const url = 'https://ratgate-api.red-gate.tech/api/apartments';

async function testSubmitLive() {
  console.log('--- Testing Add Apartment on LIVE API ---');
  try {
    const res = await axios.post(url, {
      title: 'شقة تجريبية',
      title_en: 'Test Apartment',
      price: 5000,
      priceType: 'monthly',
      location: 'التجمع الخامس',
      location_en: 'New Cairo',
      beds: '3',
      baths: '2',
      size: '150',
      description: 'وصف تجريبي',
      description_en: 'Test description',
      images: [],
      amenities: [],
      rules: [],
      type: 'apartment',
      category: 'rent'
    }, {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluMSIsImlhdCI6MTYzNjMwNjcwMn0.some_fake_token_for_testing` // This will probably fail with 401 Unauth, but let's see!
      }
    });
    console.log('✅ Response Received!', res.status);
    console.log('Data:', res.data);
  } catch (err) {
    console.error('❌ API Error:', err?.response?.status || 'Network Error');
    console.error('Details:', err?.response?.data || err.message);
  }
}

testSubmitLive();
