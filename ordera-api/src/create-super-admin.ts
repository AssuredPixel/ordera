/**
 * create-super-admin.ts
 * 
 * ONE-TIME script to create/update the SUPER_ADMIN account on your production MongoDB.
 * Run ONCE: npx ts-node src/create-super-admin.ts
 * DELETE this file after running.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './modules/users/user.schema';
import { Role } from './common/enums/role.enum';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// ─── CONFIGURE YOUR SUPER ADMIN CREDENTIALS HERE ───────────────────────────
const SUPER_ADMIN_EMAIL = 'zenovastudio.web@gmail.com';  // ← change this
const SUPER_ADMIN_PASSWORD = 'Atomic?Str0ng!Pa$$word#';         // ← change this
const SUPER_ADMIN_NAME = { first: 'Admin', last: 'Ordera' };
// ────────────────────────────────────────────────────────────────────────────

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  // Validate not running against dev data by accident
  const mongoUri = process.env.MONGODB_URI || '';
  if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
    console.error('❌ Refusing to run: MONGODB_URI points to localhost. Use Atlas URI for production.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

  const existing = await userModel.findOne({ role: Role.SUPER_ADMIN });

  if (existing) {
    // Update existing super admin
    existing.email = SUPER_ADMIN_EMAIL;
    existing.passwordHash = passwordHash;
    existing.firstName = SUPER_ADMIN_NAME.first;
    existing.lastName = SUPER_ADMIN_NAME.last;
    await existing.save();
    console.log(`✅ Super Admin UPDATED: ${SUPER_ADMIN_EMAIL}`);
  } else {
    // Create new
    await userModel.create({
      firstName: SUPER_ADMIN_NAME.first,
      lastName: SUPER_ADMIN_NAME.last,
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      role: Role.SUPER_ADMIN,
      organizationId: null,
      branchId: null,
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`✅ Super Admin CREATED: ${SUPER_ADMIN_EMAIL}`);
  }

  console.log('\n⚠️  DELETE this file (src/create-super-admin.ts) now that it has run.\n');
  await app.close();
  process.exit(0);
}

bootstrap();
