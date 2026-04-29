import {
  Controller,
  Get,
  Param,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('branch/:branchId/stats')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async getBranchStats(
    @Param('branchId') branchId: string,
    @GetUser() user: JwtPayload,
  ) {
    // SECURITY: Branch managers can only see their own branch
    if (user.role === Role.BRANCH_MANAGER && user.branchId !== branchId) {
      throw new UnauthorizedException('You do not have access to this branch data');
    }

    return this.dashboardService.getBranchStats(branchId);
  }

  @Get('branch/:branchId/live-orders')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async getLiveOrders(
    @Param('branchId') branchId: string,
    @GetUser() user: JwtPayload,
  ) {
    if (user.role === Role.BRANCH_MANAGER && user.branchId !== branchId) {
      throw new UnauthorizedException('You do not have access to this branch data');
    }

    return this.dashboardService.getLiveOrders(branchId);
  }
}
