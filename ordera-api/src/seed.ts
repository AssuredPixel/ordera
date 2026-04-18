import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { Role } from './common/enums/role.enum';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const adminEmail = 'admin@ordera.app';
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'OrderaAdmin2026!';

  console.log('--- Seeding Super Admin ---');
  
  const existing = await usersService.findByEmail(adminEmail);
  if (existing) {
    console.log('Super Admin already exists. Skipping...');
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await usersService.create({
      firstName: 'System',
      lastName: 'Admin',
      email: adminEmail,
      passwordHash,
      role: Role.SUPER_ADMIN,
      organizationId: null,
      isEmailVerified: true,
    });
    console.log('Super Admin created successfully.');
  }

  await app.close();
  console.log('Seeding complete.');
  process.exit(0);
}

bootstrap();
