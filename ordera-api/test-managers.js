require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const db = mongoose.connection;
    
    const managers = await db.collection('users').find({ role: 'branch_manager' }).toArray();
    console.log("\n--- Branch Managers ---");
    console.log(managers.map(m => ({
        email: m.email, 
        branchId: m.branchId, 
        organizationId: m.organizationId
    })));

  } catch(e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
test();
