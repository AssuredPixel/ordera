const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load environment from .env
const envPath = path.resolve(__dirname, '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const splitIdx = trimmed.indexOf('=');
    const key = trimmed.slice(0, splitIdx).trim();
    const val = trimmed.slice(splitIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
});

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/ordera";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(); // Uses the database from the URI
    const users = db.collection('users');
    const orgs = db.collection('organizations');

    // 1. Wipe existing (optional but safer for testing)
    // await users.deleteMany({});
    
    const commonPassword = await bcrypt.hash('Owner@1234', 12);
    const adminPassword = await bcrypt.hash('Admin@Ordera2026', 12);

    // 2. Organization: Healthy Meals
    let org = await orgs.findOne({ subdomain: 'healthymeals' });
    if (!org) {
      const result = await orgs.insertOne({
        name: 'Healthy Meals',
        slug: 'healthy-meals',
        subdomain: 'healthymeals',
        country: 'NG',
        isActive: true,
        createdAt: new Date()
      });
      org = { _id: result.insertedId };
      console.log('Created Organization: Healthy Meals');
    }

    // 3. User: Emeka
    const emeka = await users.findOne({ email: 'emeka@healthymeals.com' });
    if (!emeka) {
      await users.insertOne({
        firstName: 'Emeka',
        lastName: 'Okonkwo',
        email: 'emeka@healthymeals.com',
        passwordHash: commonPassword,
        role: 'OWNER',
        organizationId: org._id,
        isActive: true,
        createdAt: new Date()
      });
      console.log('Created User: emeka@healthymeals.com');
    } else {
      await users.updateOne({ email: 'emeka@healthymeals.com' }, { $set: { passwordHash: commonPassword } });
      console.log('Updated User: emeka@healthymeals.com (Password Reset)');
    }

    // 4. User: Admin
    const admin = await users.findOne({ email: 'admin@ordera.app' });
    if (!admin) {
      await users.insertOne({
        firstName: 'Admin',
        lastName: 'Ordera',
        email: 'admin@ordera.app',
        passwordHash: adminPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        createdAt: new Date()
      });
      console.log('Created User: admin@ordera.app');
    } else {
      await users.updateOne({ email: 'admin@ordera.app' }, { $set: { passwordHash: adminPassword } });
      console.log('Updated User: admin@ordera.app (Password Reset)');
    }

    console.log('--- Surgical Seeding Complete ---');

  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await client.close();
  }
}

run();
