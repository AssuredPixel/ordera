import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bill } from './schemas/bill.schema';
import { Order } from '../orders/schemas/order.schema';
import { OrderStatus } from '../../common/enums/order.enum';
import { BillStatus, PaymentMethod } from '../../common/enums/bill.enum';
import { CreateBillDto, ChargeBillDto, SplitBillDto } from './dto/bill.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectModel(Bill.name) private billModel: Model<Bill>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
  ) {}

  // ─── GET /bills ─────────────────────────────────────────────────────────────

  async findAll(organizationId: string, branchId: string, status?: BillStatus) {
    const filter: any = { organizationId, branchId };
    if (status) filter.status = status;
    return this.billModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  // ─── POST /bills (Generate from Order) ──────────────────────────────────────

  async createFromOrder(
    organizationId: string,
    branchId: string,
    staffId: string,
    dto: CreateBillDto,
  ) {
    // 1. Fetch Order and validate
    const order = await this.orderModel.findOne({
      _id: dto.orderId,
      organizationId,
      branchId,
    });
    if (!order) throw new NotFoundException('Order not found');

    // 2. Validate order status
    if (![OrderStatus.SERVED, OrderStatus.ACTIVE].includes(order.status)) {
      throw new BadRequestException(
        `Order must be ACTIVE or SERVED to generate a bill. Current: ${order.status}`,
      );
    }

    // 3. Check if bill already exists (unique index would catch it too, but let's be nice)
    const existingBill = await this.billModel.findOne({ orderId: dto.orderId });
    if (existingBill) throw new BadRequestException('A bill already exists for this order');

    // 4. Create the Bill — snapshot order details
    const bill = new this.billModel({
      organizationId,
      branchId,
      orderId: order._id,
      staffId,
      tableNumber: order.tableNumber,
      guestCount: order.guestCount,
      customerName: order.customerName,
      items: JSON.parse(JSON.stringify(order.items)), // Deep copy snapshot
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status: BillStatus.ACTIVE,
    });

    await bill.save();

    // 5. Update Order status
    order.status = OrderStatus.BILLED;
    await order.save();

    return bill;
  }

  // ─── PATCH /bills/:id/charge (Process Payment) ──────────────────────────────

  async charge(
    organizationId: string,
    branchId: string,
    billId: string,
    dto: ChargeBillDto,
  ) {
    // 1. Fetch Bill and validate
    const bill = await this.billModel.findOne({
      _id: billId,
      organizationId,
      branchId,
    });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.status !== BillStatus.ACTIVE) {
      throw new BadRequestException(`Bill is already ${bill.status}`);
    }

    // 2. Handle Tip
    let totalAmount = bill.total.amount;
    if (dto.tipType && dto.tipValue !== undefined) {
      let tipAmountValue = 0;
      if (dto.tipType === 'percentage') {
        tipAmountValue = Math.round(bill.subtotal.amount * (dto.tipValue / 100));
      } else {
        tipAmountValue = dto.tipValue;
      }

      bill.tip = {
        type: dto.tipType,
        value: dto.tipValue,
        amount: { amount: tipAmountValue, currency: bill.total.currency },
      };

      // Recalculate total
      totalAmount = bill.subtotal.amount + bill.tax.amount + tipAmountValue;
      bill.total = { amount: totalAmount, currency: bill.total.currency };
    }

    // 3. Build Payment
    bill.payment = {
      method: dto.method,
      amountPaid: { amount: totalAmount, currency: bill.total.currency },
      change: dto.method === PaymentMethod.CASH ? { amount: 0, currency: bill.total.currency } : null,
      reference: dto.reference,
      processedAt: new Date(),
    };

    // 4. Finalize
    bill.status = BillStatus.PAID;
    bill.paidAt = new Date();
    await bill.save();

    // 5. Update associated Order to COMPLETED
    await this.orderModel.updateOne(
      { _id: bill.orderId },
      { $set: { status: OrderStatus.COMPLETED } },
    );

    return bill;
  }

  // ─── POST /bills/:id/split (Divide Bill) ──────────────────────────────────

  async split(
    organizationId: string,
    branchId: string,
    billId: string,
    dto: SplitBillDto,
  ) {
    // 1. Fetch parent Bill
    const parentBill = await this.billModel.findOne({
      _id: billId,
      organizationId,
      branchId,
    });
    if (!parentBill) throw new NotFoundException('Bill not found');
    if (parentBill.status !== BillStatus.ACTIVE) {
      throw new BadRequestException('Only ACTIVE bills can be split');
    }

    const currency = parentBill.total.currency;
    const childBillIds: string[] = [];

    // 2. Generate child bills
    for (const allocation of dto.guestAllocations) {
      const selectedItems = allocation.itemIndexes.map((idx) => parentBill.items[idx]);
      if (selectedItems.some((item) => !item)) {
        throw new BadRequestException('Invalid item index in allocation');
      }

      const subtotalAmount = selectedItems.reduce((sum, item) => sum + item.lineTotal.amount, 0);
      
      // Calculate tax proportionally or fetch taxRate? Let's use proportional for complexity avoidance
      // Ratio = subtotal / parentSubtotal
      const ratio = subtotalAmount / parentBill.subtotal.amount;
      const taxAmount = Math.round(parentBill.tax.amount * ratio);
      const totalAmount = subtotalAmount + taxAmount;

      const childBill = new this.billModel({
        organizationId,
        branchId,
        orderId: parentBill.orderId,
        staffId: parentBill.staffId,
        tableNumber: parentBill.tableNumber,
        customerName: allocation.guestName,
        items: selectedItems,
        subtotal: { amount: subtotalAmount, currency },
        tax: { amount: taxAmount, currency },
        total: { amount: totalAmount, currency },
        status: BillStatus.ACTIVE,
        splitFrom: parentBill._id,
      });

      const savedChild = await childBill.save();
      childBillIds.push(savedChild._id.toString());
    }

    // 3. Update parent
    parentBill.splits = childBillIds;
    parentBill.status = BillStatus.SPLIT;
    
    await parentBill.save();

    return { parent: parentBill, children: await this.billModel.find({ _id: { $in: childBillIds } }) };
  }
}
