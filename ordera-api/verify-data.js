require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const db = mongoose.connection;
    
    const bills = await db.collection('bills').find({}).toArray();
    console.log(`Total Bills: ${bills.length}`);
    console.table(bills.map(b => ({
      id: b._id.toString().slice(-6),
      org: b.organizationId.toString().slice(-6),
      created: b.createdAt
    })));
    
    const businessDays = await db.collection('businessdays').find({}).toArray();
    console.log(`Total Business Days: ${businessDays.length}`);
    console.table(businessDays.map(d => ({
      id: d._id.toString().slice(-6),
      branch: d.branchId.toString().slice(-6),
      date: d.date,
      status: d.status
    })));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkData();
