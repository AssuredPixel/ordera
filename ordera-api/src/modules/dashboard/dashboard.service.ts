import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bill } from '../bills/schemas/bill.schema';
import { Order } from '../orders/schemas/order.schema';
import { Customer } from '../customers/schemas/customer.schema';
import { User } from '../users/user.schema';
import { BillStatus } from '../../common/enums/bill.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Bill.name) private billModel: Model<Bill>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Customer.name) private customerModel: Model<Customer>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getStats(organizationId: string, branchId: string, period: string = 'today') {
    const { currentRange, previousRange } = this.getDateRanges(period);

    // 1. Total Revenue (Paid Bills)
    const currentRevenue = await this.getRevenue(organizationId, branchId, currentRange.start, currentRange.end);
    const previousRevenue = await this.getRevenue(organizationId, branchId, previousRange.start, previousRange.end);

    // 2. Total Orders
    const currentOrders = await this.getOrderCount(organizationId, branchId, currentRange.start, currentRange.end);
    const previousOrders = await this.getOrderCount(organizationId, branchId, previousRange.start, previousRange.end);

    // 3. New Customers
    const currentNewCustomers = await this.getNewCustomerCount(organizationId, branchId, currentRange.start, currentRange.end);

    // 4. Hourly Revenue
    const hourlyRevenue = await this.getHourlyRevenue(organizationId, branchId, currentRange.start, currentRange.end);

    // 5. Best Employees
    const bestEmployees = await this.getBestEmployees(organizationId, branchId, currentRange.start, currentRange.end);

    // 6. Trending Dishes
    const trendingDishes = await this.getTrendingDishes(organizationId, branchId, currentRange.start, currentRange.end);

    // 7. Revenue By Type
    const revenueByType = await this.getRevenueByType(organizationId, branchId, currentRange.start, currentRange.end);

    return {
      period,
      totalRevenue: currentRevenue.total,
      totalOrders: currentOrders,
      newCustomers: currentNewCustomers,
      revenueChange: this.calculatePercentageChange(currentRevenue.total.amount, previousRevenue.total.amount),
      ordersChange: this.calculatePercentageChange(currentOrders, previousOrders),
      hourlyRevenue,
      bestEmployees,
      trendingDishes,
      revenueByType,
    };
  }

  private getDateRanges(period: string) {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date = now;
    let previousStart: Date;
    let previousEnd: Date;

    switch (period) {
      case 'today':
        currentStart = new Date(now.setUTCHours(0, 0, 0, 0));
        currentEnd = new Date(now.setUTCHours(23, 59, 59, 999));
        previousStart = new Date(currentStart);
        previousStart.setUTCDate(previousStart.getUTCDate() - 1);
        previousEnd = new Date(currentEnd);
        previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
        break;
      case 'yesterday':
        currentStart = new Date();
        currentStart.setUTCDate(currentStart.getUTCDate() - 1);
        currentStart.setUTCHours(0, 0, 0, 0);
        currentEnd = new Date(currentStart);
        currentEnd.setUTCHours(23, 59, 59, 999);
        previousStart = new Date(currentStart);
        previousStart.setUTCDate(previousStart.getUTCDate() - 1);
        previousEnd = new Date(currentEnd);
        previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
        break;
      case 'week':
        currentStart = new Date();
        currentStart.setUTCDate(currentStart.getUTCDate() - 7);
        previousStart = new Date(currentStart);
        previousStart.setUTCDate(previousStart.getUTCDate() - 7);
        previousEnd = currentStart;
        break;
      case 'month':
        currentStart = new Date();
        currentStart.setUTCDate(currentStart.getUTCDate() - 30);
        previousStart = new Date(currentStart);
        previousStart.setUTCDate(previousStart.getUTCDate() - 30);
        previousEnd = currentStart;
        break;
      case 'year':
        currentStart = new Date();
        currentStart.setUTCDate(currentStart.getUTCDate() - 365);
        previousStart = new Date(currentStart);
        previousStart.setUTCDate(previousStart.getUTCDate() - 365);
        previousEnd = currentStart;
        break;
      default:
        currentStart = new Date(now.setUTCHours(0, 0, 0, 0));
        previousStart = new Date(currentStart);
        previousStart.setUTCDate(previousStart.getUTCDate() - 1);
        previousEnd = currentStart;
    }

    return {
      currentRange: { start: currentStart, end: currentEnd },
      previousRange: { start: previousStart, end: previousEnd },
    };
  }

  private async getRevenue(orgId: string, branchId: string, start: Date, end: Date) {
    const result = await this.billModel.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(orgId),
          branchId: new Types.ObjectId(branchId),
          status: BillStatus.PAID,
          paidAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$total.currency',
          amount: { $sum: '$total.amount' },
        },
      },
    ]);

    if (result.length === 0) {
      return { total: { amount: 0, currency: 'NGN' } };
    }

    return {
      total: {
        amount: result[0].amount,
        currency: result[0]._id,
      },
    };
  }

  private async getOrderCount(orgId: string, branchId: string, start: Date, end: Date) {
    return this.orderModel.countDocuments({
      organizationId: new Types.ObjectId(orgId),
      branchId: new Types.ObjectId(branchId),
      createdAt: { $gte: start, $lte: end },
    });
  }

  private async getNewCustomerCount(orgId: string, branchId: string, start: Date, end: Date) {
    return this.customerModel.countDocuments({
      organizationId: new Types.ObjectId(orgId),
      branchId: new Types.ObjectId(branchId),
      createdAt: { $gte: start, $lte: end },
    });
  }

  private async getHourlyRevenue(orgId: string, branchId: string, start: Date, end: Date) {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(orgId),
          branchId: new Types.ObjectId(branchId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$createdAt' },
            type: '$orderType',
          },
          amount: { $sum: '$total.amount' },
        },
      },
      {
        $group: {
          _id: '$_id.hour',
          dineIn: { $sum: { $cond: [{ $eq: ['$_id.type', 'dine_in'] }, '$amount', 0] } },
          takeaway: { $sum: { $cond: [{ $eq: ['$_id.type', 'takeaway'] }, '$amount', 0] } },
          delivery: { $sum: { $cond: [{ $eq: ['$_id.type', 'delivery'] }, '$amount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hoursMap = result.reduce((acc, curr) => {
      acc[curr._id] = curr;
      return acc;
    }, {});

    const formatted = [];
    for (let i = 0; i < 24; i++) {
        const hourLabel = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
        const data = hoursMap[i] || { dineIn: 0, takeaway: 0, delivery: 0 };
        formatted.push({
            hour: hourLabel,
            dineIn: data.dineIn,
            takeaway: data.takeaway,
            delivery: data.delivery
        });
    }

    return formatted;
  }

  private async getBestEmployees(orgId: string, branchId: string, start: Date, end: Date) {
    return this.billModel.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(orgId),
          branchId: new Types.ObjectId(branchId),
          status: BillStatus.PAID,
          paidAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$staffId',
          revenueAmt: { $sum: '$total.amount' },
          ordersServed: { $sum: 1 },
          currency: { $first: '$total.currency' }
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
          revenue: { amount: '$revenueAmt', currency: '$currency' },
          ordersServed: 1,
        },
      },
      { $sort: { 'revenue.amount': -1 } },
      { $limit: 5 },
    ]);
  }

  private async getTrendingDishes(orgId: string, branchId: string, start: Date, end: Date) {
    return this.orderModel.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(orgId),
          branchId: new Types.ObjectId(branchId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          orderCount: { $sum: '$items.quantity' },
          revenueAmt: { $sum: '$items.lineTotal.amount' },
          currency: { $first: '$items.lineTotal.currency' }
        },
      },
      {
        $project: {
          name: '$_id',
          orderCount: 1,
          revenue: { amount: '$revenueAmt', currency: '$currency' },
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 5 },
    ]);
  }

  private async getRevenueByType(orgId: string, branchId: string, start: Date, end: Date) {
    const result = await this.billModel.aggregate([
      {
        $match: {
          organizationId: new Types.ObjectId(orgId),
          branchId: new Types.ObjectId(branchId),
          status: BillStatus.PAID,
          paidAt: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: '$order' },
      {
        $group: {
          _id: {
            type: '$order.orderType',
            currency: '$total.currency'
          },
          amount: { $sum: '$total.amount' },
        },
      },
    ]);

    const revenue = {
        dineIn: { amount: 0, currency: 'NGN' },
        takeaway: { amount: 0, currency: 'NGN' },
        delivery: { amount: 0, currency: 'NGN' }
    };

    result.forEach(r => {
        if (r._id.type === 'dine_in') revenue.dineIn = { amount: r.amount, currency: r._id.currency };
        if (r._id.type === 'takeaway') revenue.takeaway = { amount: r.amount, currency: r._id.currency };
        if (r._id.type === 'delivery') revenue.delivery = { amount: r.amount, currency: r._id.currency };
    });

    return revenue;
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }
}
