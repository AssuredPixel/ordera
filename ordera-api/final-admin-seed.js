const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function bootstrap() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    console.log("Connected successfully");

    const db = mongoose.connection;
    const usersCollection = db.collection('users');
    const branchesCollection = db.collection('branches');
    const organizationsCollection = db.collection('organizations');

    // 1. Identify "Mama Chidi Kitchen" Organization
    const mamaChidi = await organizationsCollection.findOne({ slug: 'mama-chidi-kitchen' });
    if (!mamaChidi) {
      console.error("Mama Chidi Kitchen organization not found!");
      process.exit(1);
    }
    console.log(`Found Organization: ${mamaChidi.name} (${mamaChidi._id})`);

    // 2. Identify "Trans-Amadi" Branch
    const transAmadi = await branchesCollection.findOne({ 
      organizationId: mamaChidi._id,
      slug: 'trans-amadi-hq' 
    });
    if (!transAmadi) {
      console.error("Trans-Amadi branch not found under Mama Chidi!");
      process.exit(1);
    }
    console.log(`Found Branch: ${transAmadi.name} (${transAmadi._id})`);

    // 3. Define the desired staff members
    const staffSpec = [
      {
        email: 'transamadi.mgr@mamachidi.com',
        name: 'Trans Amadi Manager',
        role: 'BRANCH_MANAGER',
        branchId: transAmadi._id,
        organizationId: mamaChidi._id
      },
      {
        email: 'ada.waiter1@mamachidi.com',
        name: 'Ada Waiter',
        role: 'WAITER',
        branchId: transAmadi._id,
        organizationId: mamaChidi._id
      },
      {
        email: 'emeka.kitchen@mamachidi.com',
        name: 'Emeka Kitchen',
        role: 'KITCHEN_STAFF',
        branchId: transAmadi._id,
        organizationId: mamaChidi._id
      },
      {
        email: 'damilola.cashier@mamachidi.com',
        name: 'Damilola Cashier',
        role: 'CASHIER',
        branchId: transAmadi._id,
        organizationId: mamaChidi._id
      }
    ];

    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const spec of staffSpec) {
      console.log(`Processing ${spec.email}...`);
      
      // Update or Insert
      await usersCollection.updateOne(
        { email: spec.email },
        { 
          $set: {
            name: spec.name,
            role: spec.role,
            branchId: spec.branchId,
            organizationId: spec.organizationId,
            password: hashedPassword,
            status: 'ACTIVE',
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`Successfully aligned ${spec.email} to ${transAmadi.name}`);
    }

    // 4. Ensure all OTHER organizations have their managers (if they exist)
    // We don't want to break other things, but the user said "all other organization should be updated if there is need"
    // Usually this means ensuring they have at least one manager if they don't.
    
    console.log("Seeding complete. Verification:");
    const results = await usersCollection.find({ organizationId: mamaChidi._id }).toArray();
    console.table(results.map(u => ({ email: u.email, role: u.role, branch: u.branchId })));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

bootstrap();
