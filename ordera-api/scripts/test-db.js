require('dotenv').config();
const mongoose = require('mongoose');

async function test() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    const db = mongoose.connection;
    
    const branches = await db.collection('branches').find().toArray();
    console.log("\n--- Branches ---");
    console.log(branches.map(b => ({id: b._id, name: b.name, slug: b.slug})));
    
    const orders = await db.collection('orders').find().toArray();
    console.log("\nTotal orders in DB:", orders.length);
    
    if(orders.length > 0) {
        const orderBranches = orders.map(o => o.branchId.toString());
        console.log("Branches with orders:", [...new Set(orderBranches)]);
        
        // Show count per branch
        const counts = {};
        orderBranches.forEach(bId => counts[bId] = (counts[bId] || 0) + 1);
        console.log("Order counts per branch:", counts);
    }
    
    const managers = await db.collection('users').find({role: 'BRANCH_MANAGER'}).toArray();
    console.log("\n--- Branch Managers ---");
    console.log(managers.map(m => ({email: m.email, branchId: m.branchId, isActive: m.isActive})));

  } catch(e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
test();
