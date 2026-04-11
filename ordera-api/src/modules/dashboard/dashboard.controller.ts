import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../users/user.schema';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(
    @GetUser() user: User,
    @Query('period') period: string = 'today'
  ) {
    return this.dashboardService.getStats(
      user.organizationId.toString(),
      user.branchId.toString(),
      period
    );
  }
}
