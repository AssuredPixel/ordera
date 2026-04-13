import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/user.schema';
import { Organization } from '../organizations/schemas/organization.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Organization.name) private organizationModel: Model<Organization>,
    private jwtService: JwtService,
  ) {}

  async login(orgSlug: string, salesId: string, password: string, metadata?: { deviceName?: string, location?: string }) {
    // 1. Get the specific organization
    const organization = await this.organizationModel.findOne({ slug: orgSlug });
    if (!organization) {
      throw new UnauthorizedException('Organization not found');
    }

    // 2. Find user by salesId and organizationId
    const user = await this.userModel.findOne({ 
      salesId, 
      organizationId: organization._id 
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Enforce single-device limit: Deactivate all existing sessions
    await this.userModel.findByIdAndUpdate(user._id, {
      $set: { 'activeSessions.$[].isActive': false }
    });

    // 5. Create a new active session
    const sessionId = uuidv4();
    const newSession = {
      sessionId,
      deviceName: metadata?.deviceName || 'Unknown Device',
      location: metadata?.location || 'Unknown Location',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
      isActive: true,
    };

    await this.userModel.findByIdAndUpdate(user._id, {
      $push: { activeSessions: newSession }
    });

    // 5. Sign JWT with sessionId
    const payload = {
      sub: user._id,
      sessionId: sessionId,
      userId: user._id,
      salesId: user.salesId,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      organizationId: user.organizationId.toString(),
      branchId: user.branchId.toString(),
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        salesId: user.salesId,
        organizationId: user.organizationId.toString(),
        branchId: user.branchId.toString(),
      },
    };
  }

  async logout(userId: string, sessionId: string) {
    if (!sessionId) return;
    
    await this.userModel.updateOne(
      { _id: userId, 'activeSessions.sessionId': sessionId },
      { $set: { 'activeSessions.$.isActive': false } }
    );
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId)
      .select('-passwordHash')
      .populate('organizationId')
      .populate('branchId');
      
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    
    return user;
  }

  async validateUser(payload: any) {
    return this.userModel.findById(payload.sub).select('-passwordHash');
  }
}
