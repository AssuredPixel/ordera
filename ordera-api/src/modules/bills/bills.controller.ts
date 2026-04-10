import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { BillStatus } from '../../common/enums/bill.enum';
import { CreateBillDto, ChargeBillDto, SplitBillDto } from './dto/bill.dto';

@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  findAll(@GetUser() user: any, @Query('status') status?: BillStatus) {
    return this.billsService.findAll(user.organizationId, user.branchId, status);
  }

  @Post()
  createFromOrder(@GetUser() user: any, @Body() dto: CreateBillDto) {
    return this.billsService.createFromOrder(
      user.organizationId,
      user.branchId,
      user.sub,
      dto,
    );
  }

  @Patch(':id/charge')
  charge(
    @GetUser() user: any,
    @Param('id') billId: string,
    @Body() dto: ChargeBillDto,
  ) {
    return this.billsService.charge(
      user.organizationId,
      user.branchId,
      billId,
      dto,
    );
  }

  @Post(':id/split')
  split(
    @GetUser() user: any,
    @Param('id') billId: string,
    @Body() dto: SplitBillDto,
  ) {
    return this.billsService.split(
      user.organizationId,
      user.branchId,
      billId,
      dto,
    );
  }
}
