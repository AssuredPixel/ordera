const { MongoClient } = require('mongodb');

async function main() {
  const uri = "mongodb://localhost:27017/ordera";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    
    console.log("--- ORGANIZATIONS ---");
    const orgs = await db.collection('organizations').find().toArray();
    console.log(orgs.map(o => ({ 
      name: o.name, 
      slug: o.slug, 
      subscriptionId: o.subscriptionId 
    })));

    console.log("\n--- SUBSCRIPTIONS ---");
    const subs = await db.collection('subscriptions').find().toArray();
    console.log(subs.map(s => ({ 
      organizationId: s.organizationId, 
      plan: s.plan, 
      status: s.status 
    })));

  } finally {
    await client.close();
  }
}

main().catch(console.error);
