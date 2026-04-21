import { Controller, Post, Get, Patch, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { Invitation } from './invitation.schema';
import { Public } from '../../common/decorators/public.decorator';
import { SubscriptionService } from '../platform/subscription.service';

@Controller('invitations')
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.BRANCH_MANAGER)
  async create(@Body() createData: Partial<Invitation>, @GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    
    // Enforce subscription staff limits
    await this.subscriptionService.enforceLimits(user.organizationId, 'staff');
    
    // Base invitation setup
    const inviteData: Partial<Invitation> = {
      ...createData,
      organizationId: user.organizationId as any,
      invitedByUserId: user.userId as any,
    };

    // Managers can only invite to their own branch
    if (user.role === Role.BRANCH_MANAGER) {
      if (!user.branchId) throw new UnauthorizedException('Manager has no branch assigned');
      inviteData.branchId = user.branchId as any;
    }

    return this.invitationsService.create(inviteData);
  }

  @Public()
  @Get('validate/:token')
  async validateToken(@Param('token') token: string) {
    return this.invitationsService.validateToken(token);
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.BRANCH_MANAGER)
  async resend(@Param('id') id: string, @GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    return this.invitationsService.resendEmail(id, user.organizationId);
  }

  @Patch(':id/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER, Role.BRANCH_MANAGER)
  async revoke(@Param('id') id: string, @GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    return this.invitationsService.revoke(id, user.organizationId);
  }
}
