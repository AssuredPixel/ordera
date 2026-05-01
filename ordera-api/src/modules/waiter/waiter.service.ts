import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../ordering/schemas/order.schema';
import { Bill } from '../billing/schemas/bill.schema';
import { BillStatus } from '../../common/enums/bill-status.enum';
import { startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class WaiterService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Bill.name) private readonly billModel: Model<Bill>,
  ) {}

  async getWaiterStats(waiterId: string, branchId: string) {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // 1. Orders Today
    const ordersToday = await this.orderModel.countDocuments({
      waiterId: waiterId,
      branchId: branchId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    // 2. Revenue Today (from PAID bills)
    const billsToday = await this.billModel.aggregate([
      {
        $match: {
          waiterId: waiterId,
          branchId: branchId,
          status: BillStatus.PAID,
          createdAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total.amount' },
        },
      },
    ]);

    const revenueToday = billsToday.length > 0 ? billsToday[0].totalRevenue : 0;

    return {
      ordersToday,
      revenueToday,
      onShiftSince: todayStart.toISOString(), // Placeholder for shift start logic
    };
  }
}
