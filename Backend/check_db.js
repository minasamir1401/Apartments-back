const db = require('./server/db');
async function check() {
  try {
    const res = await db.query('SELECT _id, title, "priceType" FROM apartments');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  }
}
check();
