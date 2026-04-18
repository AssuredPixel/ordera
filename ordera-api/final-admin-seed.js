const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = "mongodb://localhost:27017/ordera";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    
    // 1. Get current Super Admin
    const superAdmin = await db.collection('users').findOne({ role: 'super_admin' });
    if (!superAdmin) {
      console.log("No super admin found! Please seed users first.");
      return;
    }

    // 2. Clear current orgs/subs for fresh state (optional but cleaner for demo)
    await db.collection('organizations').deleteMany({});
    await db.collection('subscriptions').deleteMany({});

    const orgsData = [
      { name: 'Healthy Meals', slug: 'healthymeals', subdomain: 'healthymeals', plan: 'bread', status: 'ACTIVE' },
      { name: 'Mama Chidi Kitchen', slug: 'mamachidi', subdomain: 'mamachidi', plan: 'starter', status: 'ACTIVE' },
      { name: 'Taste of Owerri', slug: 'tasteofowerri', subdomain: 'tasteofowerri', plan: 'feast', status: 'PAST_DUE' }
    ];

    for (const data of orgsData) {
      const orgId = new ObjectId();
      const subId = new ObjectId();

      await db.collection('organizations').insertOne({
        _id: orgId,
        name: data.name,
        slug: data.slug,
        subdomain: data.subdomain,
        ownerUserId: superAdmin._id, // Assigning to super admin for simplicity
        country: 'Nigeria',
        subscriptionId: subId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await db.collection('subscriptions').insertOne({
        _id: subId,
        organizationId: orgId,
        plan: data.plan.toLowerCase(),
        status: data.status,
        gateway: 'paystack',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`Created ${data.name} with status ${data.status}`);
    }

  } finally {
    await client.close();
  }
}

main().catch(console.error);
