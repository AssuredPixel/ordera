const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://freelancer-tracker:C08SWHRIJ2HJhvfp@lawrence26.hjpqmmi.mongodb.net/?appName=lawrence26');
  const db = mongoose.connection.useDb('test'); // Or whatever the DB name is, Mongoose default is 'test' if not specified in URI
  
  // Let's just list all collections and find the users collection
  const collections = await mongoose.connection.db.collections();
  console.log("Collections:", collections.map(c => c.collectionName));

  const usersCollection = mongoose.connection.db.collection('users');
  const users = await usersCollection.find({}).toArray();
  console.log(`Found ${users.length} users in 'users' collection.`);
  
  if (users.length > 0) {
    console.log("First user:", JSON.stringify(users[0], null, 2));
  }
  
  await mongoose.disconnect();
}

check().catch(console.error);
