import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async login(salesId: string, password: string) {
    const user = await this.userModel.findOne({ salesId });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id,
      userId: user._id,
      salesId: user.salesId,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      branchId: user.branchId,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        salesId: user.salesId,
        organizationId: user.organizationId,
        branchId: user.branchId,
      },
    };
  }

  async validateUser(payload: any) {
    return this.userModel.findById(payload.sub).select('-passwordHash');
  }
}
