import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './schemas/order.schema';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { StockStatus } from '../../common/enums/stock-status.enum';
import { MenuItem } from '../menu/schemas/menu-item.schema';
import { BusinessDay } from '../scheduling/business-day.schema';
import { Shift } from '../scheduling/shift.schema';
import { ShiftStatus } from '../../common/enums/shift-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { OrderingGateway } from './ordering.gateway';
import { Branch } from '../branches/branch.schema';

@Injectable()
export class OrderingService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(MenuItem.name) private readonly menuItemModel: Model<MenuItem>,
    @InjectModel(BusinessDay.name) private readonly businessDayModel: Model<BusinessDay>,
    @InjectModel(Shift.name) private readonly shiftModel: Model<Shift>,
    @InjectModel(Branch.name) private readonly branchModel: Model<Branch>,
    private readonly notificationsService: NotificationsService,
    private readonly gateway: OrderingGateway,
  ) { }

  async createOrder(user: any, data: any) {
    // 1. Find active BusinessDay and Shift
    const activeDay = await this.businessDayModel.findOne({
      branchId: user.branchId,
      status: ShiftStatus.OPEN,
    });
    const activeShift = await this.shiftModel.findOne({
      branchId: user.branchId,
      status: ShiftStatus.OPEN,
    });

    const order = await this.orderModel.create({
      ...data,
      organizationId: user.organizationId,
      branchId: user.branchId,
      waiterId: user.userId,
      waiterName: `${user.firstName} ${user.lastName}`,
      status: OrderStatus.PENDING,
      businessDayId: activeDay?._id,
      shiftId: activeShift?._id,
      subtotal: { amount: 0, currency: 'NGN' },
      tax: { amount: 0, currency: 'NGN' },
      total: { amount: 0, currency: 'NGN' },
    });

    return order;
  }

  async addItem(orderId: string, userId: string, branchId: string, data: any) {
    const order = await this.orderModel.findOne({ _id: orderId, branchId });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cannot add items to an order that is not PENDING');
    }

    const menuItem = await this.menuItemModel.findById(data.menuItemId);
    // In a real scenario, we'd call a virtual or check the status
    if (!menuItem || menuItem.stockStatus === StockStatus.FINISHED) {
      throw new BadRequestException('Item is not orderable');
    }

    // 1. Snapshot price and addons
    const unitPrice = menuItem.price;
    const selectedAddons = [];
    let addonsTotal = 0;

    if (data.selectedAddons && data.selectedAddons.length > 0) {
      for (const addonId of data.selectedAddons) {
        const addon = (menuItem.addons as any[]).find((a) => a._id.toString() === addonId);
        if (addon) {
          selectedAddons.push({ name: addon.name, price: addon.price });
          addonsTotal += addon.price.amount;
        }
      }
    }

    const lineTotalAmount = (unitPrice.amount + addonsTotal) * data.quantity;

    // 2. Add item to array
    order.items.push({
      menuItemId: menuItem._id as any,
      name: menuItem.name,
      unitPrice,
      quantity: data.quantity,
      selectedAddons,
      lineTotal: { amount: lineTotalAmount, currency: unitPrice.currency },
      notes: data.notes,
    });

    // 3. Recalculate totals
    await this.recalculateTotals(order);
    return order.save();
  }

  async removeItem(orderId: string, index: number, userId: string, branchId: string) {
    const order = await this.orderModel.findOne({ _id: orderId, branchId });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Cannot remove items from an order that is not PENDING');
    }

    if (index < 0 || index >= order.items.length) {
      throw new BadRequestException('Invalid item index');
    }

    order.items.splice(index, 1);
    await this.recalculateTotals(order);
    return order.save();
  }

  private async recalculateTotals(order: any) {
    const subtotal = order.items.reduce((acc, item) => acc + item.lineTotal.amount, 0);

    // Get branch tax rate
    const branch = await this.branchModel.findById(order.branchId);
    const taxRate = branch?.settings?.taxRate || 0;
    const taxAmount = Math.round(subtotal * (taxRate / 100));

    order.subtotal = { amount: subtotal, currency: 'NGN' };
    order.tax = { amount: taxAmount, currency: 'NGN' };
    order.total = { amount: subtotal + taxAmount, currency: 'NGN' };
  }

  async updateStatus(orderId: string, branchId: string, newStatus: OrderStatus, user: any) {
    const order = await this.orderModel.findOne({ _id: orderId, branchId });
    if (!order) throw new NotFoundException('Order not found');

    const oldStatus = order.status;
    this.validateTransition(oldStatus, newStatus);

    order.status = newStatus;

    if (newStatus === OrderStatus.SENT_TO_KITCHEN) {
      order.sentToKitchenAt = new Date();
      this.gateway.emitToKitchen(branchId, 'order:new', order);
    } else if (newStatus === OrderStatus.READY_FOR_PICKUP) {
      order.readyAt = new Date();
      // Notify waiter
      await this.notificationsService.createNotification({
        organizationId: order.organizationId,
        branchId: order.branchId,
        recipientUserId: order.waiterId,
        type: NotificationType.ORDER_READY,
        title: 'Order Ready for Pickup',
        body: `Table ${order.tableNumber || 'N/A'} — ${order.items.length} items ready. Prepared by Kitchen.`,
        relatedOrderId: order._id as any,
      });
      this.gateway.emitToUser(order.waiterId.toString(), 'order:ready', order);
    } else if (newStatus === OrderStatus.PICKED_UP) {
      order.pickedUpAt = new Date();
    } else if (newStatus === OrderStatus.SERVED) {
      order.servedAt = new Date();
    }

    return order.save();
  }

  private validateTransition(current: OrderStatus, next: OrderStatus) {
    const valid: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.SENT_TO_KITCHEN, OrderStatus.CANCELLED],
      [OrderStatus.SENT_TO_KITCHEN]: [OrderStatus.IN_PREPARATION, OrderStatus.CANCELLED],
      [OrderStatus.IN_PREPARATION]: [OrderStatus.READY_FOR_PICKUP],
      [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.PICKED_UP],
      [OrderStatus.PICKED_UP]: [OrderStatus.SERVED],
      [OrderStatus.SERVED]: [OrderStatus.BILLED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.BILLED]: [],
    };

    if (!valid[current]?.includes(next)) {
      throw new BadRequestException(`Invalid status transition from ${current} to ${next}`);
    }
  }

  async findActive(branchId: string, role: string, userId: string) {
    const query: any = { branchId: new Types.ObjectId(branchId) };

    // Logic for active
    query.status = { $nin: [OrderStatus.CANCELLED, OrderStatus.BILLED] };

    if (role === 'WAITER') {
      query.waiterId = new Types.ObjectId(userId);
    }

    return this.orderModel.find(query).sort({ createdAt: -1 });
  }

  async findById(id: string, branchId: string) {
    return this.orderModel.findOne({ _id: id, branchId });
  }
}
