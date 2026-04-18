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
}
