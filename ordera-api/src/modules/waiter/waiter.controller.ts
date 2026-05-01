import { Controller, Get, UseGuards } from '@nestjs/common';
import { WaiterService } from './waiter.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('waiter')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WaiterController {
  constructor(private readonly waiterService: WaiterService) {}

  @Get('stats')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER, Role.OWNER)
  async getStats(@GetUser() user: any) {
    return this.waiterService.getWaiterStats(user.userId, user.branchId);
  }
}
