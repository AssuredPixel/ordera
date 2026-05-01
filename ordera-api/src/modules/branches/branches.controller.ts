import { Controller, Get, Post, Patch, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { Branch } from './branch.schema';
import { SubscriptionService } from '../platform/subscription.service';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Get()
  @Roles(Role.OWNER, Role.BRANCH_MANAGER, Role.WAITER, Role.KITCHEN_STAFF)
  async findAll(@GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization associated with this user');
    
    // If staff, only return their branch
    if (user.role !== Role.OWNER) {
      if (!user.branchId) throw new UnauthorizedException('No branch associated with this user');
      return [await this.branchesService.findOneByOrganization(user.branchId, user.organizationId)];
    }

    // If owner, return all branches
    return this.branchesService.findAllByOrganization(user.organizationId);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.BRANCH_MANAGER, Role.WAITER, Role.KITCHEN_STAFF)
  async findOne(@Param('id') id: string, @GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    if ((user.role === Role.BRANCH_MANAGER || user.role === Role.WAITER || user.role === Role.KITCHEN_STAFF) && user.branchId !== id) {
      throw new UnauthorizedException('Cannot access other branches');
    }
    return this.branchesService.findOneByOrganization(id, user.organizationId);
  }

  @Get(':id/staff')
  @Roles(Role.OWNER, Role.BRANCH_MANAGER, Role.WAITER, Role.KITCHEN_STAFF)
  async getStaff(@Param('id') id: string, @GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    if ((user.role === Role.BRANCH_MANAGER || user.role === Role.WAITER || user.role === Role.KITCHEN_STAFF) && user.branchId !== id) {
      throw new UnauthorizedException('Cannot access staff of other branches');
    }
    return this.branchesService.getBranchStaff(id, user.organizationId);
  }

  @Post()
  @Roles(Role.OWNER)
  async create(@Body() createData: Partial<Branch>, @GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    
    // Enforce subscription limits
    await this.subscriptionService.enforceLimits(user.organizationId, 'branch');
    
    return this.branchesService.create(user.organizationId, createData);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.BRANCH_MANAGER)
  async update(@Param('id') id: string, @Body() updateData: Partial<Branch>, @GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    if (user.role === Role.BRANCH_MANAGER && user.branchId !== id) {
      throw new UnauthorizedException('Cannot update other branches');
    }
    return this.branchesService.update(id, user.organizationId, updateData);
  }

  @Patch(':id/deactivate')
  @Roles(Role.OWNER)
  async deactivate(@Param('id') id: string, @GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    return this.branchesService.deactivate(id, user.organizationId);
  }

  @Patch(':id/activate')
  @Roles(Role.OWNER)
  async activate(@Param('id') id: string, @GetUser() user: JwtPayload) {
    if (!user.organizationId) throw new UnauthorizedException('No organization');
    return this.branchesService.activate(id, user.organizationId);
  }
}
