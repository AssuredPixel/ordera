import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+passwordHash');
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userModel.findOne({ googleId });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async create(data: any): Promise<User> {
    return this.userModel.create(data);
  }

  async updateLastLogin(userId: string, sessionId: string, deviceData: any) {
    return this.userModel.findByIdAndUpdate(userId, {
      $set: { lastLoginAt: new Date() },
      $push: {
        activeSessions: {
          ...deviceData,
          sessionId,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
          isActive: true,
        },
      },
    });
  }

  async removeSession(userId: string, sessionId: string) {
    return this.userModel.findByIdAndUpdate(userId, {
      $set: { 'activeSessions.$[elem].isActive': false },
    }, {
      arrayFilters: [{ 'elem.sessionId': sessionId }],
    });
  }

  async findByBranch(branchId: string): Promise<User[]> {
    return this.userModel.find({ branchId: new Types.ObjectId(branchId) }).sort({ role: 1, firstName: 1 });
  }

  async findByOrganization(orgId: string): Promise<User[]> {
    return this.userModel.find({ organizationId: new Types.ObjectId(orgId) }).sort({ role: 1, firstName: 1 });
  }

  async update(userId: string, data: Partial<User>): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true }
    );
  }

  async transferToBranch(userId: string, branchId: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: { branchId: new Types.ObjectId(branchId) } },
      { new: true }
    );
  }

  async deactivate(userId: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: { isActive: false } },
      { new: true }
    );
  }
}
