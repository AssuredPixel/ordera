const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const db = mongoose.connection;
    const branches = await db.collection('branches').find({}).toArray();
    console.table(branches.map(b => ({ name: b.name, slug: b.slug, org: b.organizationId })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
