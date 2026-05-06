require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const db = mongoose.connection;
    
    const users = await db.collection('users').find({}).toArray();
    console.log("\n--- All Users ---");
    console.log(users.map(u => ({
        email: u.email, 
        role: u.role, 
        branchId: u.branchId, 
        organizationId: u.organizationId,
        isActive: u.isActive
    })));

  } catch(e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
test();
