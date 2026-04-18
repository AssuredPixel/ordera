import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './modules/users/user.schema';
import { Organization } from './modules/organizations/organization.schema';
import { Subscription } from './modules/platform/subscription.schema';
import { Invoice } from './modules/platform/invoice.schema';
import { Role } from './common/enums/role.enum';
import { SubscriptionPlan } from './common/enums/subscription-plan.enum';
import { SubscriptionStatus } from './common/enums/subscription-status.enum';
import { PaymentGateway } from './common/enums/payment-gateway.enum';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const orgModel = app.get<Model<Organization>>(getModelToken(Organization.name));
  const subModel = app.get<Model<Subscription>>(getModelToken(Subscription.name));
  const invModel = app.get<Model<Invoice>>(getModelToken(Invoice.name));

  console.log('--- Phase 1 Seed: Starting ---');

  // 1. WIPE ALL DATA
  console.log('Wiping existing data...');
  await userModel.deleteMany({});
  await orgModel.deleteMany({});
  await subModel.deleteMany({});
  await invModel.deleteMany({});

  const commonPassword = await bcrypt.hash('Owner@1234', 12);
  const adminPassword = await bcrypt.hash('Admin@Ordera2026', 12);

  // 2. SEED SUPER ADMIN
  const superAdmin = await userModel.create({
    firstName: 'Lawrence',
    lastName: 'Ordera Admin',
    email: 'admin@ordera.app',
    passwordHash: adminPassword,
    role: Role.SUPER_ADMIN,
    organizationId: null,
    isEmailVerified: true,
  });

  // 3. ORGANIZATION 1 — Healthy Meals
  const org1 = await orgModel.create({
    name: 'Healthy Meals',
    slug: 'healthy-meals',
    subdomain: 'healthymeals',
    country: 'NG',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    contactEmail: 'owner@healthymeals.com',
    contactPhone: '+2348012345678',
    isActive: true,
  });

  const user1 = await userModel.create({
    firstName: 'Emeka',
    lastName: 'Okonkwo',
    email: 'emeka@healthymeals.com',
    passwordHash: commonPassword,
    role: Role.OWNER,
    organizationId: org1._id,
  });

  org1.ownerUserId = user1._id as any;

  const sub1 = await subModel.create({
    organizationId: org1._id,
    plan: SubscriptionPlan.BREAD, // GROWTH
    status: SubscriptionStatus.ACTIVE,
    gateway: PaymentGateway.PAYSTACK,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    gatewayCustomerId: 'PSK_CUST_001',
    gatewaySubscriptionId: 'PSK_SUB_001',
  });

  org1.subscriptionId = sub1._id as any;
  await org1.save();

  await invModel.create({
    organizationId: org1._id,
    subscriptionId: sub1._id,
    plan: SubscriptionPlan.BREAD,
    gateway: PaymentGateway.PAYSTACK,
    amount: { amount: 9900000, currency: 'NGN' },
    status: 'paid',
    paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  });

  // 4. ORGANIZATION 2 — Mama Chidi Kitchen
  const org2 = await orgModel.create({
    name: 'Mama Chidi Kitchen',
    slug: 'mama-chidi-kitchen',
    subdomain: 'mamachidi',
    country: 'NG',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    contactEmail: 'owner@mamachidi.com',
    contactPhone: '+2348023456789',
    isActive: true,
  });

  const user2 = await userModel.create({
    firstName: 'Chidi',
    lastName: 'Nwachukwu',
    email: 'chidi@mamachidi.com',
    passwordHash: commonPassword,
    role: Role.OWNER,
    organizationId: org2._id,
  });

  org2.ownerUserId = user2._id as any;

  const sub2 = await subModel.create({
    organizationId: org2._id,
    plan: SubscriptionPlan.STARTER,
    status: SubscriptionStatus.ACTIVE,
    gateway: PaymentGateway.PAYSTACK,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    gatewayCustomerId: 'PSK_CUST_002',
    gatewaySubscriptionId: 'PSK_SUB_002',
  });

  org2.subscriptionId = sub2._id as any;
  await org2.save();

  await invModel.create({
    organizationId: org2._id,
    subscriptionId: sub2._id,
    plan: SubscriptionPlan.STARTER,
    gateway: PaymentGateway.PAYSTACK,
    amount: { amount: 4900000, currency: 'NGN' },
    status: 'paid',
    paidAt: new Date(),
  });

  // 5. ORGANIZATION 3 — Taste of Owerri
  const org3 = await orgModel.create({
    name: 'Taste of Owerri',
    slug: 'taste-of-owerri',
    subdomain: 'tasteofowerri',
    country: 'NG',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    contactEmail: 'owner@tasteofowerri.com',
    contactPhone: '+2348034567890',
    isActive: true,
  });

  const user3 = await userModel.create({
    firstName: 'Adaeze',
    lastName: 'Eze',
    email: 'adaeze@tasteofowerri.com',
    passwordHash: commonPassword,
    role: Role.OWNER,
    organizationId: org3._id,
  });

  org3.ownerUserId = user3._id as any;

  const sub3 = await subModel.create({
    organizationId: org3._id,
    plan: SubscriptionPlan.FEAST, // PRO
    status: SubscriptionStatus.PAST_DUE,
    gateway: PaymentGateway.PAYSTACK,
    currentPeriodStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    paymentFailureCount: 2,
    gatewayCustomerId: 'PSK_CUST_003',
    gatewaySubscriptionId: 'PSK_SUB_003',
  });

  org3.subscriptionId = sub3._id as any;
  await org3.save();

  await invModel.create({
    organizationId: org3._id,
    subscriptionId: sub3._id,
    plan: SubscriptionPlan.FEAST,
    gateway: PaymentGateway.PAYSTACK,
    amount: { amount: 19900000, currency: 'NGN' },
    status: 'failed',
    failureReason: 'Insufficient funds',
  });

  console.log('\nPhase 1 Seed Complete');
  console.log('-----------------------------------');
  console.log('Super Admin: admin@ordera.app / Admin@Ordera2026');
  console.log('Org 1 Owner: emeka@healthymeals.com / Owner@1234 (subdomain: healthymeals)');
  console.log('Org 2 Owner: chidi@mamachidi.com / Owner@1234 (subdomain: mamachidi)');
  console.log('Org 3 Owner: adaeze@tasteofowerri.com / Owner@1234 (subdomain: tasteofowerri)');
  console.log('-----------------------------------');

  await app.close();
  process.exit(0);
}

bootstrap();
