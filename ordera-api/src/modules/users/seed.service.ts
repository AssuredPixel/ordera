import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async onModuleInit() {
    const organizationId = 'org_001';
    const branchId = 'br_west_01';
    const passwordHash = await bcrypt.hash('password123', 12);

    const testUsers = [
      {
        salesId: '1001',
        email: 'owner@ordera.com',
        name: 'Chinedu Okeke',
        role: Role.OWNER,
        passwordHash,
        organizationId,
        branchId,
      },
      {
        salesId: '2001',
        email: 'manager@ordera.com',
        name: 'Amina Yusuf',
        role: Role.MANAGER,
        passwordHash,
        organizationId,
        branchId,
      },
      {
        salesId: '3001',
        email: 'supervisor@ordera.com',
        name: 'Babatunde Adekunle',
        role: Role.SUPERVISOR,
        passwordHash,
        organizationId,
        branchId,
      },
      {
        salesId: '4001',
        email: 'waiter@ordera.com',
        name: 'Emeka Nwosu',
        role: Role.WAITER,
        passwordHash,
        organizationId,
        branchId,
      },
      {
        salesId: '5001',
        email: 'kitchen@ordera.com',
        name: 'Chef Kelvin Peter',
        role: Role.KITCHEN,
        passwordHash,
        organizationId,
        branchId,
      },
    ];

    console.log('--- Ordera Seeding Process Starting ---');
    try {
      for (const userData of testUsers) {
        const result = await this.userModel.findOneAndUpdate(
          { salesId: userData.salesId },
          { $set: userData },
          { upsert: true, new: true, runValidators: true }
        );
        console.log(`[Seed] Processed user: ${userData.salesId} | Role: ${userData.role} | ID: ${result._id}`);
      }
      console.log('--- Ordera Seeding Process Completed Successfully ---');
    } catch (error) {
      console.error('--- Ordera Seeding Process Failed ---');
      console.error(error);
    }

  }
}
