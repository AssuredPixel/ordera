import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Invitation } from './invitation.schema';
import { InvitationStatus } from '../../common/enums/invitation-status.enum';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class InvitationsService {
  private resend: Resend;

  constructor(
    @InjectModel(Invitation.name) private invitationModel: Model<Invitation>,
    private configService: ConfigService
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async create(data: Partial<Invitation>) {
    if (data.role === Role.SUPER_ADMIN || data.role === Role.OWNER) {
      throw new BadRequestException('Cannot invite users as Super Admin or Owner');
    }

    const token = randomUUID();
    
    // Check if there is already a pending invitation for this email in this branch
    const existing = await this.invitationModel.findOne({
      email: data.email,
      branchId: data.branchId,
      status: InvitationStatus.PENDING
    });

    if (existing) {
      throw new BadRequestException('A pending invitation already exists for this email in this branch');
    }

    const invitation = await this.invitationModel.create({
      ...data,
      organizationId: new Types.ObjectId(data.organizationId as unknown as string),
      branchId: new Types.ObjectId(data.branchId as unknown as string),
      invitedByUserId: new Types.ObjectId(data.invitedByUserId as unknown as string),
      token,
    });

    await this.sendInvitationEmail(invitation);
    
    return invitation;
  }

  private async sendInvitationEmail(invitation: Invitation) {
    if (!this.resend) {
      console.warn('RESEND_API_KEY missing - skipping email send (Development mode). Token: ' + invitation.token);
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/register/staff?token=${invitation.token}`;
    
    try {
      await this.resend.emails.send({
        from: 'Ordera <noreply@ordera.app>',
        to: invitation.email,
        subject: `You've been invited to join Ordera`,
        html: `
          <p>Hi ${invitation.firstName || ''},</p>
          <p>You have been invited to join an Ordera branch as a <strong>${invitation.role.replace('_', ' ')}</strong>.</p>
          <p>Click the link below to set up your account:</p>
          <a href="${link}">${link}</a>
          <p>This link expires in 48 hours.</p>
        `
      });

      invitation.emailSentAt = new Date();
      await invitation.save();
    } catch (err) {
      console.error('Failed to send invitation email via Resend', err);
    }
  }

  async validateToken(token: string) {
    const invitation = await this.invitationModel.findOne({ token, status: InvitationStatus.PENDING });
    if (!invitation) return { valid: false };

    if (invitation.expiresAt < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await invitation.save();
      return { valid: false };
    }

    return { valid: true, data: invitation };
  }

  async resendEmail(id: string, organizationId: string) {
    const invitation = await this.invitationModel.findOne({ 
      _id: new Types.ObjectId(id), 
      organizationId: new Types.ObjectId(organizationId) 
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Cannot resend a non-pending invitation');
    }

    invitation.token = randomUUID();
    invitation.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    invitation.resentCount += 1;
    await invitation.save();

    await this.sendInvitationEmail(invitation);
    return invitation;
  }

  async revoke(id: string, organizationId: string) {
    const invitation = await this.invitationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), organizationId: new Types.ObjectId(organizationId) },
      { $set: { status: InvitationStatus.REVOKED } },
      { new: true }
    );
    if (!invitation) throw new NotFoundException('Invitation not found');
    return invitation;
  }
  async findPendingByBranch(branchId: string): Promise<Invitation[]> {
    return this.invitationModel.find({ 
      branchId: new Types.ObjectId(branchId), 
      status: InvitationStatus.PENDING 
    }).sort({ createdAt: -1 });
  }
}
