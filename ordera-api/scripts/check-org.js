require('dotenv').config();
const mongoose = require('mongoose');

async function checkOrg() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const db = mongoose.connection;
    const org = await db.collection('organizations').findOne({ slug: 'mama-chidi-kitchen' });
    console.log("Mama Chidi Organization:", JSON.stringify(org, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkOrg();
