const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://freelancer-tracker:C08SWHRIJ2HJhvfp@lawrence26.hjpqmmi.mongodb.net/?appName=lawrence26";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('test'); // NestJS uses 'test' by default if not specified in URI path
    const users = database.collection('users');
    const allUsers = await users.find({ salesId: { $in: ['1001', '2001', '3001', '4001'] } }).toArray();
    console.log('--- Seeded Users Found ---');
    allUsers.forEach(u => console.log(`- ${u.salesId}: ${u.name} (${u.role})`));
    console.log('Total count:', allUsers.length);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
