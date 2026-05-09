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
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { ResourceOwnerGuard } from '../../common/guards/resource-owner.guard';
import { CreateBillDto, ChargeBillDto } from './dto/bill.dto';

@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnerGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  async getBills(
    @GetUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    if (status === 'past') {
      return this.billsService.findHistory(user.branchId as string, user.organizationId as string, user.role, user.userId);
    }
    return this.billsService.findActive(user.branchId as string, user.organizationId as string, user.role, user.userId);
  }

  @Get(':id')
  async getBill(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.billsService.findById(id, user.branchId as string, user.organizationId as string);
  }

  @Post()
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async createBill(@Body() dto: CreateBillDto, @GetUser() user: JwtPayload) {
    return this.billsService.createBill(dto.orderId, user.branchId as string, user.organizationId as string);
  }

  @Post(':id/charge')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER, Role.CASHIER)
  async chargeBill(
    @Param('id') id: string,
    @GetUser() user: JwtPayload,
    @Body() data: ChargeBillDto,
  ) {
    return this.billsService.chargeBill(id, user.branchId as string, user.organizationId as string, user.userId, data);
  }

  @Patch(':id/cancel')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async cancelBill(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.billsService.cancelBill(id, user.branchId as string, user.organizationId as string);
  }
}
