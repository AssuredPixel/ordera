import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from '../ordering/schemas/order.schema';
import { Bill } from '../billing/schemas/bill.schema';
import { User } from '../users/user.schema';
import { MenuItem } from '../menu/schemas/menu-item.schema';
import { BusinessDay } from '../scheduling/business-day.schema';
import { BillStatus } from '../../common/enums/bill-status.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { StockStatus } from '../../common/enums/stock-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Bill.name) private readonly billModel: Model<Bill>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(MenuItem.name) private readonly itemModel: Model<MenuItem>,
    @InjectModel(BusinessDay.name) private readonly businessDayModel: Model<BusinessDay>,
  ) {}

  async getBranchStats(branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Get Current Business Day
    const businessDay = await this.businessDayModel.findOne({
      branchId: new Types.ObjectId(branchId),
      date: { $gte: today },
    }).sort({ createdAt: -1 });

    const businessDayId = businessDay?._id;

    // 2. Revenue (Today's PAID bills)
    const revenueStats = await this.billModel.aggregate([
      { 
        $match: { 
          branchId: new Types.ObjectId(branchId),
          status: BillStatus.PAID,
          createdAt: { $gte: today }
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total.amount' }
        }
      }
    ]);

    const revenue = revenueStats[0]?.total || 0;

    // 3. Orders Count
    const ordersToday = await this.orderModel.countDocuments({
      branchId: new Types.ObjectId(branchId),
      createdAt: { $gte: today }
    });

    // 4. Open Orders (Not Served, Not Billed, Not Cancelled)
    // Actually "Live" orders usually means anything not SETTLED or CANCELLED
    const openOrders = await this.orderModel.countDocuments({
      branchId: new Types.ObjectId(branchId),
      status: { $in: [OrderStatus.PENDING, OrderStatus.SENT_TO_KITCHEN, OrderStatus.IN_PREPARATION, OrderStatus.READY_FOR_PICKUP, OrderStatus.SERVED] }
    });

    // 5. Staff on Shift
    const staffOnShift = await this.userModel.countDocuments({
      branchId: new Types.ObjectId(branchId),
      isActive: true
    });

    // 6. Stock Alerts
    const stockAlerts = await this.itemModel.find({
      branchId: new Types.ObjectId(branchId),
      stockStatus: { $in: [StockStatus.LOW, StockStatus.FINISHED] }
    }).populate('categoryId', 'name').limit(10);

    // 7. Staff Performance (Today)
    const performance = await this.orderModel.aggregate([
      {
        $match: {
          branchId: new Types.ObjectId(branchId),
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$waiterId',
          waiterName: { $first: '$waiterName' },
          ordersCount: { $sum: 1 },
          revenue: { $sum: '$total.amount' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // 8. Recent Bills
    const recentBills = await this.billModel
      .find({ branchId: new Types.ObjectId(branchId) })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      kpis: {
        revenue,
        ordersToday,
        staffOnShift,
        openOrders
      },
      businessDay: businessDay || { status: 'none' },
      stockAlerts,
      performance,
      recentBills
    };
  }

  async getLiveOrders(branchId: string) {
    return this.orderModel
      .find({
        branchId: new Types.ObjectId(branchId),
        status: { $ne: OrderStatus.CANCELLED }
      })
      .sort({ createdAt: -1 })
      .limit(50);
  }
}
