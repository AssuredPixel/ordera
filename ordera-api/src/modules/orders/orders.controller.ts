import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { OrderStatus } from '../../common/enums/order.enum';
import { CreateOrderDto, AddOrderItemDto, UpdateOrderStatusDto } from './dto/order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // GET /orders?status=pending
  @Get()
  findAll(@GetUser() user: any, @Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(user.organizationId, user.branchId, status);
  }

  // GET /orders/:id
  @Get(':id')
  findOne(@GetUser() user: any, @Param('id') id: string) {
    return this.ordersService.findOne(user.organizationId, user.branchId, id);
  }

  // POST /orders
  @Post()
  createOrder(@GetUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(
      user.sub,
      user.organizationId,
      user.branchId,
      dto,
    );
  }

  // POST /orders/:id/items
  @Post(':id/items')
  addItem(
    @GetUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: AddOrderItemDto,
  ) {
    return this.ordersService.addItem(
      user.organizationId,
      user.branchId,
      orderId,
      dto,
    );
  }

  // PATCH /orders/:id/status
  @Patch(':id/status')
  updateStatus(
    @GetUser() user: any,
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(
      user.organizationId,
      user.branchId,
      orderId,
      dto,
    );
  }

  // DELETE /orders/:id — supervisor+ only, PENDING orders only
  @Delete(':id')
  @Roles(Role.OWNER, Role.MANAGER, Role.SUPERVISOR)
  cancelOrder(@GetUser() user: any, @Param('id') orderId: string) {
    return this.ordersService.cancelOrder(
      user.organizationId,
      user.branchId,
      orderId,
    );
  }
}
