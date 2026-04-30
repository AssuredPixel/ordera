import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bill } from '../billing/schemas/bill.schema';
import { Order } from '../ordering/schemas/order.schema';
import { MenuItem } from '../menu/schemas/menu-item.schema';
import { BillStatus } from '../../common/enums/bill-status.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Bill.name) private readonly billModel: Model<Bill>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(MenuItem.name) private readonly itemModel: Model<MenuItem>,
  ) {}

  async getRevenueReport(branchId: string, startDate: Date, endDate: Date) {
    return this.billModel.aggregate([
      {
        $match: {
          branchId: new Types.ObjectId(branchId),
          status: BillStatus.PAID,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$total.amount' },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async getTopItems(branchId: string, startDate: Date, endDate: Date, limit: number = 10) {
    // We aggregate from orders to see item popularity
    return this.orderModel.aggregate([
      {
        $match: {
          branchId: new Types.ObjectId(branchId),
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
    ]);
  }

  async getStaffLeaderboard(branchId: string, startDate: Date, endDate: Date) {
    return this.billModel.aggregate([
      {
        $match: {
          branchId: new Types.ObjectId(branchId),
          status: BillStatus.PAID,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$waiterId',
          waiterName: { $first: '$waiterName' },
          revenue: { $sum: '$total.amount' },
          billsCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);
  }

  async getSummary(branchId: string, startDate: Date, endDate: Date) {
    const revenueTrend = await this.getRevenueReport(branchId, startDate, endDate);
    const topItems = await this.getTopItems(branchId, startDate, endDate);
    const staffLeaderboard = await this.getStaffLeaderboard(branchId, startDate, endDate);

    const totalRevenue = revenueTrend.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = revenueTrend.reduce((sum, day) => sum + day.ordersCount, 0);

    return {
      revenueTrend,
      topItems,
      staffLeaderboard,
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
    };
  }
}
