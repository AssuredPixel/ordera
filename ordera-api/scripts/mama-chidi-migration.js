const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    console.log("Connected");

    const db = mongoose.connection;
    
    // 1. Find Mama Chidi Kitchen Organization
    const mamaChidi = await db.collection('organizations').findOne({ slug: 'mama-chidi-kitchen' });
    if (!mamaChidi) {
      console.error("Mama Chidi Kitchen organization not found!");
      process.exit(1);
    }
    console.log(`Found Organization: ${mamaChidi.name} (${mamaChidi._id})`);

    // 2. Define "Today" (2026-05-02)
    const today = new Date('2026-05-02T00:00:00Z');
    const tonight = new Date('2026-05-02T23:59:59Z');

    // 3. Move Bills
    const billResult = await db.collection('bills').updateMany(
      { organizationId: mamaChidi._id },
      { $set: { 
          createdAt: today, 
          updatedAt: today,
          'payment.paidAt': today
        } 
      }
    );
    console.log(`Updated ${billResult.modifiedCount} bills to ${today.toISOString()}`);

    // 4. Move Business Days
    const bdResult = await db.collection('businessdays').updateMany(
      { organizationId: mamaChidi._id },
      { $set: { 
          date: today,
          status: 'OPEN', // Ensure it's uppercase if that's the standard
          actualOpen: today,
          updatedAt: today
        } 
      }
    );
    console.log(`Updated ${bdResult.modifiedCount} business days to ${today.toISOString()}`);

    // 5. Move Orders (optional but helpful for dashboard)
    const orderResult = await db.collection('orders').updateMany(
      { organizationId: mamaChidi._id },
      { $set: { 
          createdAt: today, 
          updatedAt: today
        } 
      }
    );
    console.log(`Updated ${orderResult.modifiedCount} orders to ${today.toISOString()}`);

    console.log("Data migration complete.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
