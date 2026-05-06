console.log("--- Seeding Verification Script Starting ---");
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Load environment
console.log("Loading .env file...");
const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error("No .env file found at: " + envPath);
  process.exit(1);
}
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

async function check() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ordera';
  console.log(`Attempting to connect to MongoDB: ${uri.replace(/:([^@]+)@/, ':****@')}`);
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected successfully!");
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
  
  const dbName = mongoose.connection.db.databaseName;
  console.log(`Current Database: ${dbName}`);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  const usersCollection = mongoose.connection.db.collection('users');
  const users = await usersCollection.find({}).toArray();
  console.log(`Found ${users.length} users in 'users' collection.`);
  
  if (users.length > 0) {
    console.log("Seeded Users:");
    users.forEach(u => {
      console.log(` - SalesId: ${u.salesId} | Name: ${u.name} | Role: ${u.role}`);
    });
  }
  
  await mongoose.disconnect();
  console.log("Disconnected.");
}

check().catch(err => {
  console.error("CRITICAL ERROR:", err);
  process.exit(1);
});

