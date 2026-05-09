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
import { OrderStatus } from '../../common/enums/order-status.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { ResourceOwnerGuard } from '../../common/guards/resource-owner.guard';
import { CreateOrderDto, AddOrderItemDto } from './dto/order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderingController {
  constructor(private readonly orderingService: OrderingService) { }

  @Get()
  @UseGuards(ResourceOwnerGuard)
  async getOrders(
    @GetUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    // Basic filtering logic based on role
    return this.orderingService.findActive(user.branchId as string, user.organizationId as string, user.role, user.userId);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.orderingService.findById(id, user.branchId as string, user.organizationId as string);
  }

  @Post()
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async createOrder(@GetUser() user: JwtPayload, @Body() data: CreateOrderDto) {
    return this.orderingService.createOrder(user, data);
  }

  @Post(':id/items')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async addItem(
    @Param('id') id: string,
    @GetUser() user: JwtPayload,
    @Body() data: AddOrderItemDto,
  ) {
    return this.orderingService.addItem(id, user.userId, user.branchId as string, user.organizationId as string, data);
  }

  @Delete(':id/items/:index')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async removeItem(
    @Param('id') id: string,
    @Param('index') index: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.orderingService.removeItem(id, index, user.userId, user.branchId as string, user.organizationId as string);
  }

  @Patch(':id/send-to-kitchen')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async sendToKitchen(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.orderingService.updateStatus(id, user.branchId as string, user.organizationId as string, OrderStatus.SENT_TO_KITCHEN, user);
  }

  @Patch(':id/acknowledge')
  @Roles(Role.KITCHEN_STAFF, Role.BRANCH_MANAGER)
  async acknowledge(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.orderingService.updateStatus(id, user.branchId as string, user.organizationId as string, OrderStatus.IN_PREPARATION, user);
  }

  @Patch(':id/mark-ready')
  @Roles(Role.KITCHEN_STAFF, Role.BRANCH_MANAGER)
  async markReady(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.orderingService.updateStatus(id, user.branchId as string, user.organizationId as string, OrderStatus.READY_FOR_PICKUP, user);
  }

  @Patch(':id/picked-up')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async pickedUp(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.orderingService.updateStatus(id, user.branchId as string, user.organizationId as string, OrderStatus.PICKED_UP, user);
  }

  @Patch(':id/served')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async served(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.orderingService.updateStatus(id, user.branchId as string, user.organizationId as string, OrderStatus.SERVED, user);
  }

  @Patch(':id/cancel')
  @Roles(Role.WAITER, Role.BRANCH_MANAGER)
  async cancel(@Param('id') id: string, @GetUser() user: JwtPayload) {
    return this.orderingService.updateStatus(id, user.branchId as string, user.organizationId as string, OrderStatus.CANCELLED, user);
  }
}
