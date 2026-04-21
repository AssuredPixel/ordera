// Run this with: node surgical-staff-seed.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is missing in .env');
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');
    const orgs = db.collection('organizations');
    const branches = db.collection('branches');

    const org = await orgs.findOne({});
    if (!org) {
        console.error('No organization found. Please run main seed first.');
        return;
    }
    const branch = await branches.findOne({ organizationId: org._id });
    if (!branch) {
        console.error('No branch found for this organization.');
        return;
    }

    const passwordHash = await bcrypt.hash('ordera123', 12);

    const staff = [
      { email: 'waiter@ordera.app', role: 'WAITER', firstName: 'Wait', lastName: 'Er' },
      { email: 'kitchen@ordera.app', role: 'KITCHEN_STAFF', firstName: 'Kit', lastName: 'Chen' }
    ];

    for (const s of staff) {
      const exists = await users.findOne({ email: s.email });
      if (!exists) {
        await users.insertOne({
          organizationId: org._id,
          branchId: branch._id,
          email: s.email,
          passwordHash,
          role: s.role,
          firstName: s.firstName,
          lastName: s.lastName,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✅ Created ${s.role} user: ${s.email}`);
      } else {
        console.log(`ℹ️ ${s.role} user already exists: ${s.email}`);
      }
    }

    console.log('\n--- Test Credentials ---');
    console.log('Password for all: ordera123');
    console.log('------------------------\n');

  } catch (err) {
    console.error('Error seeding staff:', err);
  } finally {
    await client.close();
  }
}
run();
