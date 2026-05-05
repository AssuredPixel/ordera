const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const db = mongoose.connection;
    const users = await db.collection('users').find({ email: { $in: [
      'ada.waiter1@mamachidi.com',
      'emeka.kitchen@mamachidi.com',
      'damilola.cashier@mamachidi.com',
      'transamadi.mgr@mamachidi.com'
    ]}}).toArray();
    
    console.table(users.map(u => ({
      email: u.email,
      role: u.role,
      branchId: u.branchId,
      orgId: u.organizationId
    })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();
