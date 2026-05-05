require('dotenv').config();
const mongoose = require('mongoose');

async function updateOrders() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const db = mongoose.connection;
    
    const today = new Date();
    today.setHours(10, 0, 0, 0); // Set to 10 AM today

    const branches = await db.collection('branches').find({ slug: { $in: ['trans-amadi-hq', 'new-gra'] } }).toArray();
    const branchIds = branches.map(b => b._id);

    console.log("Updating orders for branches:", branches.map(b => b.name));

    const result = await db.collection('orders').updateMany(
      { branchId: { $in: branchIds } },
      { $set: { createdAt: today, updatedAt: today } }
    );

    console.log(`Updated ${result.modifiedCount} orders to today's date.`);

    // Also update bills
    const billResult = await db.collection('bills').updateMany(
      { branchId: { $in: branchIds } },
      { $set: { createdAt: today, updatedAt: today } }
    );
    console.log(`Updated ${billResult.modifiedCount} bills to today's date.`);

    // Also ensure business day is open for today
    for (const branch of branches) {
        await db.collection('businessdays').updateOne(
            { branchId: branch._id, date: { $gte: new Date().setHours(0,0,0,0) } },
            { 
                $set: { 
                    status: 'OPEN', 
                    date: new Date().setHours(0,0,0,0),
                    actualOpen: new Date().setHours(8,0,0,0)
                } 
            },
            { upsert: true }
        );
        console.log(`Ensured business day is OPEN for ${branch.name}`);
    }

  } catch(e) {
    console.error("Error:", e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
updateOrders();
