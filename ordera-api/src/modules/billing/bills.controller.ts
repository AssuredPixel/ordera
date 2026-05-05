import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  async getBills(
    @GetUser() user: any,
    @Query('status') status?: string,
  ) {
    if (status === 'past') {
      return this.billsService.findHistory(user.branchId, user.role, user.userId);
    }
    return this.billsService.findActive(user.branchId, user.role, user.userId);
  }

  @Get(':id')
  async getBill(@Param('id') id: string, @GetUser('branchId') branchId: string) {
    return this.billsService.findById(id, branchId);
  }

  @Post()
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async createBill(@Body('orderId') orderId: string, @GetUser('branchId') branchId: string) {
    return this.billsService.createBill(orderId, branchId);
  }

  @Post(':id/charge')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER, Role.CASHIER)
  async chargeBill(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.billsService.chargeBill(id, user.branchId, user.userId, data);
  }

  @Patch(':id/cancel')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async cancelBill(@Param('id') id: string, @GetUser('branchId') branchId: string) {
    return this.billsService.cancelBill(id, branchId);
  }
}
