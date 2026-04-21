import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { SubscriptionService } from '../platform/subscription.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { Role } from '../../common/enums/role.enum';
import { generateOrganizationSlug } from '../organizations/organization.schema';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InvitationsService } from '../invitations/invitations.service';
import { InvitationStatus } from '../../common/enums/invitation-status.enum';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly orgService: OrganizationsService,
    private readonly subService: SubscriptionService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly invitationService: InvitationsService,
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
    try {
      const existingOrg = await this.orgService.findBySubdomain(subdomain);
      if (existingOrg) throw new ConflictException('Business name already taken for subdomain');
    } catch (e: any) {
      // If error is NOT a 404, then something else went wrong (e.g. database down, 500)
      // If it IS a 404, it means the subdomain is available, so we continue.
      const status = e.status || e.response?.statusCode || e.getStatus?.();
      if (status !== 404) throw e;
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 5. Create Org (placeholder ownerUserId)
    const org = await this.orgService.create({
      name: dto.businessName,
      subdomain,
      country: dto.country,
      contactPhone: dto.contactPhone,
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

  // 1.5. POST /api/auth/register-staff
  async registerStaff(body: { token: string; password: string }) {
    // 1. Validate token
    const { valid, data: invitation } = await this.invitationService.validateToken(body.token);
    if (!valid || !invitation) {
      throw new UnauthorizedException('Invalid or expired invitation token');
    }

    // 2. Check if email somehow already exists (in case they signed up another way after invite)
    const existingUser = await this.usersService.findByEmail(invitation.email);
    if (existingUser) {
      throw new ConflictException('User already registered');
    }

    // 3. Create the user
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await this.usersService.create({
      organizationId: invitation.organizationId as any,
      branchId: invitation.branchId as any,
      email: invitation.email,
      passwordHash,
      role: invitation.role,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
    });

    // 4. Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.acceptedAt = new Date();
    invitation.acceptedByUserId = user._id as any;
    await invitation.save();

    // 5. Login the user automatically
    const org = await this.orgService.findById(user.organizationId as any);
    const accessToken = await this.generateToken(user, org?.subdomain || null);

    return {
      accessToken,
      user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      organization: org
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

    const sessionId = randomUUID();
    await this.usersService.updateLastLogin(user._id as any, sessionId, { deviceName: dto.deviceName || 'Web' });
    const accessToken = await this.generateToken(user, subdomain);
    const populatedOrg = org ? await this.orgService.findById(org._id as any) : null;

    return { 
      accessToken, 
      user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      organization: populatedOrg 
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

      const sessionId = randomUUID();
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
