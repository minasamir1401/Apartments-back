const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'server', '.env') });
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Not Loaded');
console.log('Path:', path.resolve(__dirname, 'server', '.env'));
