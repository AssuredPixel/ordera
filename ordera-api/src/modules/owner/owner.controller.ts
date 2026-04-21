import { Controller, Get, UseGuards, UnauthorizedException, Patch, Body, Param, Delete } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@Controller('owner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('dashboard/stats')
  async getDashboardStats(@GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    return this.ownerService.getDashboardStats(user.organizationId);
  }

  // --- STAFF MANAGEMENT ---

  @Get('staff')
  async getStaff(@GetUser() user: JwtPayload) {
    return this.ownerService.getStaff(user.organizationId as string);
  }

  @Patch('staff/:id/role')
  async updateStaffRole(
    @GetUser() user: JwtPayload,
    @Param('id') userId: string,
    @Body('role') role: Role
  ) {
    return this.ownerService.updateStaffRole(userId, user.organizationId as string, role);
  }

  @Patch('staff/:id/transfer')
  async transferStaff(
    @GetUser() user: JwtPayload,
    @Param('id') userId: string,
    @Body('branchId') branchId: string
  ) {
    return this.ownerService.transferStaff(userId, user.organizationId as string, branchId);
  }

  @Delete('staff/:id')
  async deactivateStaff(@GetUser() user: JwtPayload, @Param('id') userId: string) {
    return this.ownerService.deactivateStaff(userId, user.organizationId as string);
  }

  // --- SETTINGS ---

  @Get('settings')
  async getSettings(@GetUser() user: JwtPayload) {
    return this.ownerService.getSettings(user.organizationId as string, user.userId);
  }

  @Patch('settings/organization')
  async updateOrganization(@GetUser() user: JwtPayload, @Body() data: any) {
    return this.ownerService.updateOrganization(user.organizationId as string, data);
  }

  @Patch('settings/profile')
  async updateProfile(@GetUser() user: JwtPayload, @Body() data: any) {
    return this.ownerService.updateProfile(user.userId, data);
  }
}
