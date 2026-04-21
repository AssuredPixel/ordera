import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './modules/users/user.schema';
import { Organization } from './modules/organizations/organization.schema';
import { Branch } from './modules/branches/branch.schema';
import { ShiftTemplate } from './modules/scheduling/shift-template.schema';
import { Role } from './common/enums/role.enum';
import { OperatingMode } from './common/enums/operating-mode.enum';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const orgModel = app.get<Model<Organization>>(getModelToken(Organization.name));
  const branchModel = app.get<Model<Branch>>(getModelToken(Branch.name));
  const templateModel = app.get<Model<ShiftTemplate>>(getModelToken(ShiftTemplate.name));

  console.log('\n--- Phase 2 Seed: Starting (non-destructive — adds to Phase 1 data) ---\n');

  // ── Guard: Phase 1 must exist ──────────────────────────────────────────────
  const org1 = await orgModel.findOne({ subdomain: 'healthymeals' });
  const org2 = await orgModel.findOne({ subdomain: 'mamachidi' });
  const org3 = await orgModel.findOne({ subdomain: 'tasteofowerri' });

  if (!org1 || !org2 || !org3) {
    console.error('❌  Phase 1 data not found. Run seed-phase1.ts first.\n');
    process.exit(1);
  }

  // ── Wipe only Phase 2 data (branches + shift templates from previous phase 2 run) ──
  await branchModel.deleteMany({});
  await templateModel.deleteMany({});
  // Remove any previously seeded manager users from branches
  await userModel.deleteMany({ role: Role.BRANCH_MANAGER });

  const managerPassword = await bcrypt.hash('Manager@1234', 12);

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper: create a branch + its manager
  // ─────────────────────────────────────────────────────────────────────────────
  async function seedBranch(
    orgId: Types.ObjectId,
    branchData: Partial<Branch>,
    manager: { firstName: string; lastName: string; email: string },
  ) {
    const branch = await branchModel.create({
      organizationId: orgId,
      ...branchData,
    });

    const user = await userModel.create({
      organizationId: orgId,
      branchId: branch._id,
      role: Role.BRANCH_MANAGER,
      firstName: manager.firstName,
      lastName: manager.lastName,
      email: manager.email,
      passwordHash: managerPassword,
      isEmailVerified: true,
    });

    return { branch, manager: user };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ORG 1 — HEALTHY MEALS (Abuja)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding Healthy Meals branches...');

  const { branch: hm_wuse } = await seedBranch(
    org1._id as Types.ObjectId,
    {
      name: 'Healthy Meals Wuse',
      slug: 'wuse-hq',
      isHeadquarters: true,
      operatingMode: OperatingMode.DAY_BASED,
      reconciliationMode: 'per_day',
      address: {
        street: 'Plot 14 Ademola Adetokunbo Crescent',
        city: 'Wuse Zone 2',
        state: 'FCT',
        country: 'NG',
      },
      phone: '+2348012345679',
      isActive: true,
      settings: { taxRate: 7.5, receiptFooter: 'Thank you for choosing Healthy Meals Wuse!' } as any,
    },
    { firstName: 'Kemi', lastName: 'Adeyemi', email: 'kemi.wuse@healthymeals.com' },
  );

  const { branch: hm_garki } = await seedBranch(
    org1._id as Types.ObjectId,
    {
      name: 'Healthy Meals Garki',
      slug: 'garki',
      isHeadquarters: false,
      operatingMode: OperatingMode.SHIFT_BASED,
      reconciliationMode: 'per_shift',
      address: {
        street: '22 Ibrahim Babangida Way',
        city: 'Garki Area 11',
        state: 'FCT',
        country: 'NG',
      },
      phone: '+2348012345680',
      isActive: true,
    },
    { firstName: 'Tunde', lastName: 'Fashola', email: 'tunde.garki@healthymeals.com' },
  );

  // Shift templates for Garki (SHIFT_BASED)
  await templateModel.create([
    {
      organizationId: org1._id,
      branchId: hm_garki._id,
      name: 'Morning Shift',
      startTime: '08:00',
      endTime: '16:00',
      crossesMidnight: false,
      isActive: true,
    },
    {
      organizationId: org1._id,
      branchId: hm_garki._id,
      name: 'Night Shift',
      startTime: '16:00',
      endTime: '23:00',
      crossesMidnight: false,
      isActive: true,
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ORG 2 — MAMA CHIDI KITCHEN (Port Harcourt)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding Mama Chidi branches...');

  const { branch: mc_transamadi } = await seedBranch(
    org2._id as Types.ObjectId,
    {
      name: 'Mama Chidi Trans-Amadi',
      slug: 'trans-amadi-hq',
      isHeadquarters: true,
      operatingMode: OperatingMode.DAY_BASED,
      reconciliationMode: 'per_day',
      address: {
        street: '7 Rumuobiakani Road',
        city: 'Trans-Amadi Industrial Layout',
        state: 'Rivers',
        country: 'NG',
      },
      phone: '+2348023456790',
      isActive: true,
    },
    { firstName: 'Ngozi', lastName: 'Obi', email: 'ngozi.transamadi@mamachidi.com' },
  );

  const { branch: mc_newgra } = await seedBranch(
    org2._id as Types.ObjectId,
    {
      name: 'Mama Chidi New GRA',
      slug: 'new-gra',
      isHeadquarters: false,
      operatingMode: OperatingMode.DAY_BASED,
      reconciliationMode: 'per_day',
      address: {
        street: '45 Peter Odili Road',
        city: 'New GRA Phase 2',
        state: 'Rivers',
        country: 'NG',
      },
      phone: '+2348023456791',
      isActive: true,
    },
    { firstName: 'Emeka', lastName: 'Eze', email: 'emeka.newgra@mamachidi.com' },
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // ORG 3 — TASTE OF OWERRI (Owerri)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('Seeding Taste of Owerri branches...');

  const { branch: tow_douglas } = await seedBranch(
    org3._id as Types.ObjectId,
    {
      name: 'Taste of Owerri Douglas Road',
      slug: 'douglas-hq',
      isHeadquarters: true,
      operatingMode: OperatingMode.DAY_BASED,
      reconciliationMode: 'per_day',
      address: {
        street: '12 Douglas Road',
        city: 'Owerri',
        state: 'Imo',
        country: 'NG',
      },
      phone: '+2348034567891',
      isActive: true,
    },
    { firstName: 'Chioma', lastName: 'Nwosu', email: 'chioma.douglas@tasteofowerri.com' },
  );

  const { branch: tow_worldbank } = await seedBranch(
    org3._id as Types.ObjectId,
    {
      name: 'Taste of Owerri World Bank',
      slug: 'world-bank',
      isHeadquarters: false,
      operatingMode: OperatingMode.SHIFT_BASED,
      reconciliationMode: 'per_shift',
      address: {
        street: '3 Orji Road',
        city: 'World Bank Housing Estate',
        state: 'Imo',
        country: 'NG',
      },
      phone: '+2348034567892',
      isActive: true,
    },
    { firstName: 'Obiora', lastName: 'Okafor', email: 'obiora.worldbank@tasteofowerri.com' },
  );

  // Shift templates for World Bank (SHIFT_BASED)
  await templateModel.create([
    {
      organizationId: org3._id,
      branchId: tow_worldbank._id,
      name: 'Morning',
      startTime: '07:00',
      endTime: '15:00',
      crossesMidnight: false,
      isActive: true,
    },
    {
      organizationId: org3._id,
      branchId: tow_worldbank._id,
      name: 'Afternoon',
      startTime: '15:00',
      endTime: '23:00',
      crossesMidnight: false,
      isActive: true,
    },
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  const branchCount = await branchModel.countDocuments();
  console.log(`\n✅  Phase 2 Seed Complete — ${branchCount} branches created`);
  console.log('═══════════════════════════════════════════════════════════════');

  console.log('\n📍  BRANCH ADDRESSES:');
  console.log('  [HM-1] Healthy Meals Wuse      → Plot 14 Ademola Adetokunbo Crescent, Wuse Zone 2, FCT');
  console.log('  [HM-2] Healthy Meals Garki      → 22 Ibrahim Babangida Way, Garki Area 11, FCT');
  console.log('  [MC-1] Mama Chidi Trans-Amadi   → 7 Rumuobiakani Road, Trans-Amadi Industrial Layout, Rivers');
  console.log('  [MC-2] Mama Chidi New GRA       → 45 Peter Odili Road, New GRA Phase 2, Rivers');
  console.log('  [TOW-1] Taste of Owerri Douglas → 12 Douglas Road, Owerri, Imo');
  console.log('  [TOW-2] Taste of Owerri WorldBk → 3 Orji Road, World Bank Housing Estate, Imo');

  console.log('\n👤  BRANCH MANAGER CREDENTIALS (password: Manager@1234 for all):');
  console.log('  kemi.wuse@healthymeals.com       → HM Wuse (DAY_BASED / HQ)');
  console.log('  tunde.garki@healthymeals.com     → HM Garki (SHIFT_BASED — Morning 08-16, Night 16-23)');
  console.log('  ngozi.transamadi@mamachidi.com   → MC Trans-Amadi (DAY_BASED / HQ)');
  console.log('  emeka.newgra@mamachidi.com       → MC New GRA (DAY_BASED)');
  console.log('  chioma.douglas@tasteofowerri.com → TOW Douglas Road (DAY_BASED / HQ)');
  console.log('  obiora.worldbank@tasteofowerri.com → TOW World Bank (SHIFT_BASED — Morning 07-15, Afternoon 15-23)');
  console.log('\n  🔑  All Branch Manager IDs resolve to their branchId in JWT.\n');

  console.log('═══════════════════════════════════════════════════════════════\n');

  await app.close();
  process.exit(0);
}

bootstrap();
