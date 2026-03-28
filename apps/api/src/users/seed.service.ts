import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';
import { UserRole } from '@ordera/shared';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async onModuleInit() {
    const restaurantId = 'rest_001';
    const passwordHash = await bcrypt.hash('password123', 12);

    const testUsers = [
      {
        salesId: '1001',
        email: 'owner@ordera.com',
        name: 'Chinedu Okeke',
        role: UserRole.OWNER,
        passwordHash,
        restaurantId,
      },
      {
        salesId: '2001',
        email: 'manager@ordera.com',
        name: 'Amina Yusuf',
        role: UserRole.MANAGER,
        passwordHash,
        restaurantId,
      },
      {
        salesId: '3001',
        email: 'supervisor@ordera.com',
        name: 'Babatunde Adekunle',
        role: UserRole.SUPERVISOR,
        passwordHash,
        restaurantId,
      },
      {
        salesId: '4001',
        email: 'waiter@ordera.com',
        name: 'Emeka Nwosu',
        role: UserRole.WAITER,
        passwordHash,
        restaurantId,
      },
    ];

    console.log('--- Ordera Seeding Process Starting ---');
    for (const userData of testUsers) {
      await this.userModel.findOneAndUpdate(
        { salesId: userData.salesId },
        { $set: userData },
        { upsert: true, new: true }
      );
      console.log(`- Processed user: ${userData.salesId} (${userData.role})`);
    }
    console.log('--- Ordera Seeding Process Completed ---');
  }
}
