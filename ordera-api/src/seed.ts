import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { Role } from './common/enums/role.enum';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Schemas for seeding (simplified)
const OrgSchema = new mongoose.Schema({
  name: String,
  slug: { type: String, unique: true },
  country: String,
  currency: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const BranchSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  name: String,
  slug: { type: String },
  address: { street: String, city: String, state: String, country: String, postalCode: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  salesId: String,
  passwordHash: String,
  role: String,
  firstName: String,
  lastName: String,
  email: String,
  isActive: { type: Boolean, default: true },
  activeSessions: { type: Array, default: [] }
}, { timestamps: true });

async function seed() {
  console.log('--- Ordera Multi-Tenancy Seeder ---');
  await mongoose.connect(MONGODB_URI as string);
  console.log('Connected to MongoDB.');

  const OrganizationModel = mongoose.model('Organization', OrgSchema);
  const BranchModel = mongoose.model('Branch', BranchSchema);
  const UserModel = mongoose.model('User', UserSchema);

  const orgConfigs = [
    { name: 'Demo Restaurant', slug: 'demo', country: 'NG', currency: 'NGN' },
    { name: 'Lagos Lounge', slug: 'lagos', country: 'NG', currency: 'NGN' },
    { name: 'Pizza Place', slug: 'pizza', country: 'US', currency: 'USD' },
  ];

  const passwordHash = await bcrypt.hash('password123', 12);

  for (const config of orgConfigs) {
    console.log(`Processing Organization: ${config.name}...`);
    
    // 1. Upsert Organization
    const org = await OrganizationModel.findOneAndUpdate(
      { slug: config.slug },
      { $set: config },
      { upsert: true, new: true }
    );

    // 2. Upsert Branch
    const branch = await BranchModel.findOneAndUpdate(
      { organizationId: org._id, slug: 'main' },
      { 
        $set: { 
          name: 'Main Branch',
          address: { street: '123 Street', city: 'City', country: config.country } 
        } 
      },
      { upsert: true, new: true }
    );

    const rolesData = [
      { role: Role.OWNER, prefix: 'OWNER' },
      { role: Role.MANAGER, prefix: 'MGR' },
      { role: Role.SUPERVISOR, prefix: 'SUP' },
      { role: Role.WAITER, prefix: 'WAIT' },
      { role: Role.KITCHEN, prefix: 'KITC' },
    ];

    for (const roleInfo of rolesData) {
      const salesId = `${roleInfo.prefix}001`;
      console.log(`  Seeding User: ${salesId}...`);
      
      await UserModel.findOneAndUpdate(
        { organizationId: org._id, salesId: salesId },
        {
          $set: {
            organizationId: org._id,
            branchId: branch._id,
            salesId: salesId,
            passwordHash: passwordHash,
            role: roleInfo.role,
            firstName: roleInfo.prefix.charAt(0) + roleInfo.prefix.slice(1).toLowerCase(),
            lastName: config.name.split(' ')[0],
            email: `${salesId.toLowerCase()}@${config.slug}.com`,
            isActive: true
          }
        },
        { upsert: true }
      );
    }
  }

  console.log('Seeding completed successfully.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
