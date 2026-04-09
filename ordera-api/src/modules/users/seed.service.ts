import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './user.schema';
import { Role } from '../../common/enums/role.enum';
import { Organization } from '../organizations/schemas/organization.schema';
import { Branch } from '../branches/schemas/branch.schema';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
  ) { }

  async onModuleInit() {
    console.log('--- Ordera Seeding Process Starting ---');
    try {
      // 1. Create Default Organization
      const orgData = {
        name: 'AssuredPixel HQ',
        slug: 'assuredpixel-hq',
        country: 'NG',
        timezone: 'Africa/Lagos',
        currency: 'NGN',
        isActive: true,
      };

      const organization = await this.organizationModel.findOneAndUpdate(
        { slug: orgData.slug },
        { $set: orgData },
        { upsert: true, new: true }
      );
      const organizationId = organization._id;

      // 2. Create Default Branch
      const branchData = {
        name: 'Lagos Mainland',
        slug: 'lagos-mainland',
        address: {
          street: '123 Ikeja St',
          city: 'Lagos',
          state: 'Lagos State',
          country: 'NG',
          postalCode: '100001',
        },
        phone: '+234 800 000 0001',
        email: 'mainland@assuredpixel.com',
        timezone: 'Africa/Lagos',
        currency: 'NGN',
        organizationId: organizationId,
        settings: {
          taxRate: 7.5,
          acceptsCash: true,
          acceptsCard: true,
          receiptFooter: 'Thank you for your business!',
        },
      };

      const branch = await this.branchModel.findOneAndUpdate(
        { slug: branchData.slug, organizationId: organizationId },
        { $set: branchData },
        { upsert: true, new: true }
      );
      const branchId = branch._id;

      // 3. Update Organization with ownerId (Post-seed logic)
      const passwordHash = await bcrypt.hash('password123', 12);

      const testUsers = [
        {
          salesId: '1001',
          email: 'owner@ordera.com',
          firstName: 'Chinedu',
          lastName: 'Okeke',
          role: Role.OWNER,
          passwordHash,
          organizationId,
          branchId,
        },
        {
          salesId: '4001',
          email: 'waiter@ordera.com',
          firstName: 'Emeka',
          lastName: 'Nwosu',
          role: Role.WAITER,
          passwordHash,
          organizationId,
          branchId,
        },
      ];

      for (const userData of testUsers) {
        const result = await this.userModel.findOneAndUpdate(
          { salesId: userData.salesId, organizationId: organizationId },
          { $set: userData },
          { upsert: true, new: true, runValidators: true }
        );

        if (userData.role === Role.OWNER && !organization.ownerUserId) {
          await this.organizationModel.findByIdAndUpdate(organizationId, {
            ownerUserId: result._id,
          });
        }
        
        console.log(`[Seed] Processed user: ${userData.salesId} | Role: ${userData.role} | ID: ${result._id}`);
      }
      console.log('--- Ordera Seeding Process Completed Successfully ---');
    } catch (error) {
      console.error('--- Ordera Seeding Process Failed ---');
      console.error(error);
    }
  }
}
