import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './schemas/order.schema';
import { MenuItem } from '../menu/schemas/menu-item.schema';
import { Branch } from '../branches/schemas/branch.schema';
import { OrderStatus } from '../../common/enums/order.enum';
import { CreateOrderDto, AddOrderItemDto, UpdateOrderStatusDto } from './dto/order.dto';

// Legal status transitions — enforces the order lifecycle
const ALLOWED_TRANSITIONS: Record<string, OrderStatus[]> = {
  [OrderStatus.PENDING]:   [OrderStatus.ACTIVE, OrderStatus.CANCELLED],
  [OrderStatus.ACTIVE]:    [OrderStatus.SERVED, OrderStatus.CANCELLED],
  [OrderStatus.SERVED]:    [OrderStatus.BILLED],
  [OrderStatus.BILLED]:    [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItem>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
  ) {}

  // ─── GET /orders ─────────────────────────────────────────────────────────────

  async findAll(organizationId: string, branchId: string, status?: OrderStatus) {
    const filter: any = { organizationId, branchId };
    if (status) filter.status = status;
    return this.orderModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  // ─── GET /orders/:id ─────────────────────────────────────────────────────────

  async findOne(organizationId: string, branchId: string, orderId: string) {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId, branchId });
    if (!order) throw new NotFoundException('Order not found in this branch');
    return order;
  }

  // ─── POST /orders ─────────────────────────────────────────────────────────────

  async createOrder(
    staffId: string,
    organizationId: string,
    branchId: string,
    dto: CreateOrderDto,
  ) {
    // Get branch currency for Money fields
    const branch = await this.branchModel.findOne({ _id: branchId, organizationId });
    if (!branch) throw new NotFoundException('Branch not found');
    const currency = branch.currency || 'NGN';

    const zeroCurrency = { amount: 0, currency };
    const order = new this.orderModel({
      ...dto,
      staffId,
      organizationId,
      branchId,
      status: OrderStatus.PENDING,
      items: [],
      subtotal: zeroCurrency,
      tax: zeroCurrency,
      total: zeroCurrency,
    });
    return order.save();
  }

  // ─── POST /orders/:id/items ───────────────────────────────────────────────────

  async addItem(
    organizationId: string,
    branchId: string,
    orderId: string,
    dto: AddOrderItemDto,
  ) {
    // 1. Validate the order exists and belongs to this branch
    const order = await this.orderModel.findOne({ _id: orderId, organizationId, branchId });
    if (!order) throw new NotFoundException('Order not found in this branch');

    // 2. Only allow items on PENDING or ACTIVE orders
    if (![OrderStatus.PENDING, OrderStatus.ACTIVE].includes(order.status)) {
      throw new BadRequestException(
        `Cannot add items to an order with status "${order.status}"`,
      );
    }

    // 3. Fetch the MenuItem — validate it belongs to this branch
    const menuItem = await this.menuItemModel.findOne({
      _id: dto.menuItemId,
      organizationId,
      branchId,
      isActive: true,
    });
    if (!menuItem) {
      throw new NotFoundException('Menu item not found or unavailable in this branch');
    }
    if (!menuItem.inStock) {
      throw new BadRequestException(`"${menuItem.name}" is currently out of stock`);
    }

    const currency = menuItem.price.currency;

    // 4. Build addon snapshots — capture price at this moment
    const addonSnapshots = (dto.addons || []).map((a) => ({
      name: a.name,
      price: { amount: a.amount, currency: a.currency || currency },
    }));

    // 5. Calculate lineTotal (all in subunits — never divide here)
    const addonTotal = addonSnapshots.reduce((sum, a) => sum + a.price.amount, 0);
    const lineTotalAmount = menuItem.price.amount * dto.quantity + addonTotal * dto.quantity;

    // 6. Build the full OrderItem snapshot
    const orderItem = {
      menuItemId: menuItem._id,
      name: menuItem.name,                           // Frozen at order time
      unitPrice: { amount: menuItem.price.amount, currency },
      quantity: dto.quantity,
      addons: addonSnapshots,
      lineTotal: { amount: lineTotalAmount, currency },
      notes: dto.notes,
    };

    order.items.push(orderItem as any);

    // 7–10. Recalculate subtotal, tax, total
    await this.recalculateTotals(order, branchId, organizationId);

    return order.save();
  }

  // ─── PATCH /orders/:id/status ─────────────────────────────────────────────────

  async updateStatus(
    organizationId: string,
    branchId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId, branchId });
    if (!order) throw new NotFoundException('Order not found in this branch');

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition order from "${order.status}" to "${dto.status}". ` +
        `Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`,
      );
    }

    order.status = dto.status;
    return order.save();
  }

  // ─── DELETE /orders/:id ───────────────────────────────────────────────────────

  async cancelOrder(organizationId: string, branchId: string, orderId: string) {
    const order = await this.orderModel.findOne({ _id: orderId, organizationId, branchId });
    if (!order) throw new NotFoundException('Order not found in this branch');

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Only PENDING orders can be cancelled. Current status: "${order.status}"`,
      );
    }

    order.status = OrderStatus.CANCELLED;
    await order.save();
    return { message: 'Order cancelled', id: order._id };
  }

  // ─── Private: Recalculate totals ─────────────────────────────────────────────

  private async recalculateTotals(order: any, branchId: string, organizationId: string) {
    const currency = order.items[0]?.lineTotal?.currency || 'NGN';

    // Sum all lineTotals — all in subunits
    const subtotalAmount = order.items.reduce(
      (sum: number, item: any) => sum + item.lineTotal.amount,
      0,
    );

    // Fetch live taxRate from branch settings
    const branch = await this.branchModel.findOne({ _id: branchId, organizationId });
    const taxRate = branch?.settings?.taxRate ?? 0;

    const taxAmount = Math.round(subtotalAmount * (taxRate / 100));
    const totalAmount = subtotalAmount + taxAmount;

    order.subtotal = { amount: subtotalAmount, currency };
    order.tax = { amount: taxAmount, currency };
    order.total = { amount: totalAmount, currency };
  }
}
