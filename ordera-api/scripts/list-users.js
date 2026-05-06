const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Load environment from .env
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

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/ordera";
const client = new MongoClient(uri);


async function run() {
  try {
    await client.connect();
    const database = client.db('test'); // NestJS uses 'test' by default if not specified in URI path
    const users = database.collection('users');
    const allUsers = await users.find({}).toArray();

    console.log('--- Seeded Users Found ---');
    allUsers.forEach(u => console.log(`- ${u.salesId}: ${u.name} (${u.role})`));
    console.log('Total count:', allUsers.length);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
