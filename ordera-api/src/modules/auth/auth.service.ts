import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { SubscriptionService } from '../platform/subscription.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { Role } from '../../common/enums/role.enum';
import { generateOrganizationSlug } from '../organizations/organization.schema';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly orgService: OrganizationsService,
    private readonly subService: SubscriptionService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get('GOOGLE_CLIENT_ID'));
  }

  // 1. POST /api/auth/register
  async register(dto: RegisterDto) {
    // 1. Check email
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) throw new ConflictException('Email already registered');

    // 2. Subdomain check
    const subdomain = generateOrganizationSlug(dto.businessName);
    const existingOrg = await this.orgService.findBySubdomain(subdomain);
    if (existingOrg) throw new ConflictException('Business name already taken for subdomain');

    // 4. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 5. Create Org (placeholder ownerUserId)
    const org = await this.orgService.create({
      name: dto.businessName,
      subdomain,
      country: dto.country,
    });

    // 6. Create User
    const user = await this.usersService.create({
      organizationId: org._id,
      email: dto.email,
      passwordHash,
      role: Role.OWNER,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // 7. Create Subscription
    const sub = await this.subService.create(org._id as any, dto.plan, dto.gateway);

    // 8, 9. Linking
    await this.orgService.updateSubscription(org._id as any, sub._id as any);
    org.ownerUserId = user._id as any;
    await org.save();

    const accessToken = await this.generateToken(user, org.subdomain);
    
    return { 
      organization: org, 
      user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }, 
      accessToken 
    };
  }

  // 2. POST /api/auth/login
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const org = user.organizationId ? await this.orgService.findById(user.organizationId as any) : null;
    const subdomain = org ? org.subdomain : null;

    const sessionId = uuidv4();
    await this.usersService.updateLastLogin(user._id as any, sessionId, { deviceName: dto.deviceName || 'Web' });

    const accessToken = await this.generateToken(user, subdomain);

    return { 
      accessToken, 
      user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      organization: org 
    };
  }

  // 3. POST /api/auth/google
  async googleLogin(token: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('Invalid Google token');

      const user = await this.usersService.findByGoogleId(payload.sub);
      if (!user) {
        return { 
          requiresRegistration: true, 
          googleProfile: { 
            googleId: payload.sub, 
            email: payload.email, 
            firstName: payload.given_name, 
            lastName: payload.family_name,
            avatarUrl: payload.picture
          } 
        };
      }

      const org = user.organizationId ? await this.orgService.findById(user.organizationId as any) : null;
      const accessToken = await this.generateToken(user, org?.subdomain || null);

      const sessionId = uuidv4();
      await this.usersService.updateLastLogin(user._id as any, sessionId, { deviceName: 'Google OAuth' });

      return { accessToken, user, organization: org };
    } catch (e) {
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  private async generateToken(user: any, subdomain: string | null) {
    const payload = {
      userId: user._id,
      role: user.role,
      organizationId: user.organizationId || null,
      branchId: user.branchId || null,
      subdomain,
    };
    return this.jwtService.signAsync(payload);
  }
}
