import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrderingService } from './ordering.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderingController {
  constructor(private readonly orderingService: OrderingService) { }

  @Get()
  async getOrders(
    @GetUser() user: any,
    @Query('status') status?: string,
  ) {
    // Basic filtering logic based on role
    return this.orderingService.findActive(user.branchId, user.role, user.userId);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @GetUser('branchId') branchId: string) {
    return this.orderingService.findById(id, branchId);
  }

  @Post()
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async createOrder(@GetUser() user: any, @Body() data: any) {
    return this.orderingService.createOrder(user, data);
  }

  @Post(':id/items')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async addItem(
    @Param('id') id: string,
    @GetUser() user: any,
    @Body() data: any,
  ) {
    return this.orderingService.addItem(id, user.userId, user.branchId, data);
  }

  @Delete(':id/items/:index')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async removeItem(
    @Param('id') id: string,
    @Param('index') index: number,
    @GetUser() user: any,
  ) {
    return this.orderingService.removeItem(id, index, user.userId, user.branchId);
  }

  @Patch(':id/send-to-kitchen')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async sendToKitchen(@Param('id') id: string, @GetUser() user: any) {
    return this.orderingService.updateStatus(id, user.branchId, OrderStatus.SENT_TO_KITCHEN, user);
  }

  @Patch(':id/acknowledge')
  @Roles(Role.KITCHEN_STAFF, Role.BRANCH_MANAGER)
  async acknowledge(@Param('id') id: string, @GetUser() user: any) {
    return this.orderingService.updateStatus(id, user.branchId, OrderStatus.IN_PREPARATION, user);
  }

  @Patch(':id/mark-ready')
  @Roles(Role.KITCHEN_STAFF, Role.BRANCH_MANAGER)
  async markReady(@Param('id') id: string, @GetUser() user: any) {
    return this.orderingService.updateStatus(id, user.branchId, OrderStatus.READY_FOR_PICKUP, user);
  }

  @Patch(':id/picked-up')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async pickedUp(@Param('id') id: string, @GetUser() user: any) {
    return this.orderingService.updateStatus(id, user.branchId, OrderStatus.PICKED_UP, user);
  }

  @Patch(':id/served')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async served(@Param('id') id: string, @GetUser() user: any) {
    return this.orderingService.updateStatus(id, user.branchId, OrderStatus.SERVED, user);
  }

  @Patch(':id/cancel')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async cancel(@Param('id') id: string, @GetUser() user: any) {
    return this.orderingService.updateStatus(id, user.branchId, OrderStatus.CANCELLED, user);
  }
}
