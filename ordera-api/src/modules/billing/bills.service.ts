import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bill } from './schemas/bill.schema';
import { BillStatus } from '../../common/enums/bill-status.enum';
import { Order } from '../ordering/schemas/order.schema';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { PusherService } from '../messages/pusher.service';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(Bill.name) private readonly billModel: Model<Bill>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly pusherService: PusherService,
  ) {}

  async createBill(orderId: string, branchId: string) {
    const order = await this.orderModel.findOne({ _id: orderId, branchId });
    if (!order) throw new NotFoundException('Order not found');
    const allowedStatuses = [
      OrderStatus.SENT_TO_KITCHEN,
      OrderStatus.IN_PREPARATION,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.PICKED_UP,
      OrderStatus.SERVED,
    ];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException('Order must be sent to kitchen before billing');
    }

    const existing = await this.billModel.findOne({ orderId: order._id });
    if (existing) throw new ConflictException('Bill already exists for this order');

    const bill = await this.billModel.create({
      organizationId: order.organizationId,
      branchId: order.branchId,
      orderId: order._id,
      waiterId: order.waiterId,
      waiterName: order.waiterName,
      tableNumber: order.tableNumber,
      guestCount: order.guestCount,
      customerName: order.customerName,
      items: JSON.parse(JSON.stringify(order.items)), // Deep snapshot
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status: BillStatus.ACTIVE,
      shiftId: order.shiftId,
      businessDayId: order.businessDayId,
    });

    // We don't mark as BILLED yet, just tracking
    // order.status = OrderStatus.BILLED;
    // await order.save();

    return bill;
  }

  async chargeBill(id: string, branchId: string, userId: string, data: any) {
    const bill = await this.billModel.findOne({ _id: id, branchId });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== BillStatus.ACTIVE) {
      throw new BadRequestException('Bill is not active');
    }

    // 1. Tip Logic
    if (data.tipType && data.tipValue) {
      let tipAmountValue = 0;
      if (data.tipType === 'percentage') {
        tipAmountValue = Math.round(bill.subtotal.amount * (data.tipValue / 100));
      } else {
        tipAmountValue = data.tipValue;
      }
      
      bill.tip = {
        type: data.tipType,
        value: data.tipValue,
        amount: { amount: tipAmountValue, currency: bill.subtotal.currency }
      };
      
      // Update total
      bill.total.amount = bill.subtotal.amount + bill.tax.amount + tipAmountValue;
    }

    // 2. Payment Logic
    const amountPaid = data.amountPaid || bill.total.amount;
    const change = amountPaid > bill.total.amount ? amountPaid - bill.total.amount : 0;

    bill.payment = {
      method: data.method as PaymentMethod,
      amountPaid: { amount: amountPaid, currency: bill.total.currency },
      change: { amount: change, currency: bill.total.currency },
      reference: data.reference,
      processedAt: new Date(),
      processedByUserId: new Types.ObjectId(userId),
    };

    bill.status = BillStatus.PAID;
    bill.paidAt = new Date();

    // Trigger Real-time update for Dashboard/Staff
    this.pusherService.trigger(`branch-${branchId}`, 'bill:paid', {
      billId: bill._id,
      amount: bill.total.amount,
      waiterName: bill.waiterName,
    });

    // Update order status to BILLED
    await this.orderModel.updateOne(
      { _id: bill.orderId },
      { $set: { status: OrderStatus.BILLED } }
    );

    return bill.save();
  }

  async findActive(branchId: string, role: string, userId: string) {
    const query: any = { branchId, status: BillStatus.ACTIVE };
    if (role === Role.WAITER) {
      query.waiterId = userId;
    }
    return this.billModel.find(query).sort({ createdAt: -1 });
  }

  async findById(id: string, branchId: string) {
    return this.billModel.findOne({ _id: id, branchId });
  }

  async cancelBill(id: string, branchId: string) {
    const bill = await this.billModel.findOne({ _id: id, branchId });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== BillStatus.ACTIVE) {
      throw new BadRequestException('Only active bills can be cancelled');
    }

    bill.status = BillStatus.CANCELLED;
    
    // Revert order status
    const order = await this.orderModel.findById(bill.orderId);
    if (order) {
      order.status = OrderStatus.SERVED;
      await order.save();
    }

    return bill.save();
  }

  async updateBillItems(orderId: any, data: { items: any[], subtotal: any, tax: any, total: any }) {
    await this.billModel.updateOne(
      { orderId, status: BillStatus.ACTIVE },
      { $set: data }
    );
  }
}
