import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category } from './schemas/category.schema';
import { MenuItem } from './schemas/menu-item.schema';
import { StockHistory } from './schemas/stock-history.schema';
import { StockStatus } from '../../common/enums/stock-status.enum';
import { Role } from '../../common/enums/role.enum';
import { slugify } from '../../common/utils/slugify';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { NotificationType } from '../../common/enums/notification-type.enum';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItem>,
    @InjectModel(StockHistory.name) private stockHistoryModel: Model<StockHistory>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  // --- CATEGORIES ---

  async getCategories(organizationId: string, branchId: string): Promise<Category[]> {
    return this.categoryModel
      .find({
        organizationId: new Types.ObjectId(organizationId),
        branchId: new Types.ObjectId(branchId),
        isActive: true,
      })
      .sort({ displayOrder: 1 });
  }

  async createCategory(organizationId: string, branchId: string, data: any): Promise<Category> {
    const slug = slugify(data.name);
    const category = new this.categoryModel({
      ...data,
      organizationId: new Types.ObjectId(organizationId),
      branchId: new Types.ObjectId(branchId),
      slug,
    });
    return category.save();
  }

  async updateCategory(id: string, data: any): Promise<Category | null> {
    if (data.name) {
      data.slug = slugify(data.name);
    }
    return this.categoryModel.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async reorderCategories(organizationId: string, branchId: string, orders: { id: string; displayOrder: number }[]): Promise<void> {
    const bulkOps = orders.map((o) => ({
      updateOne: {
        filter: { 
          _id: new Types.ObjectId(o.id),
          organizationId: new Types.ObjectId(organizationId),
          branchId: new Types.ObjectId(branchId),
        },
        update: { $set: { displayOrder: o.displayOrder } },
      },
    }));
    await this.categoryModel.bulkWrite(bulkOps);
  }

  // --- MENU ITEMS ---

  async getItemsByCategory(categoryId: string, role: string): Promise<MenuItem[]> {
    const query: any = { categoryId: new Types.ObjectId(categoryId), isActive: true };
    
    if (role === Role.WAITER) {
      query.stockStatus = { $ne: StockStatus.FINISHED };
    }
    
    return this.menuItemModel.find(query).sort({ name: 1 });
  }

  async createMenuItem(organizationId: string, branchId: string, data: any): Promise<MenuItem> {
    const item = new this.menuItemModel({
      ...data,
      categoryId: new Types.ObjectId(data.categoryId), // explicit cast prevents string vs ObjectId mismatch
      organizationId: new Types.ObjectId(organizationId),
      branchId: new Types.ObjectId(branchId),
    });
    return item.save();
  }

  async updateMenuItem(id: string, data: any): Promise<MenuItem | null> {
    return this.menuItemModel.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deactivateMenuItem(id: string): Promise<MenuItem | null> {
    return this.menuItemModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
  }

  // --- STOCK MANAGEMENT ---

  async updateStock(
    itemId: string,
    newStatus: StockStatus,
    changer: { userId: string; role: Role },
    note?: string,
    shiftId?: string,
    businessDayId?: string,
  ): Promise<MenuItem> {
    console.log(`[MenuService] updateStock started for item ${itemId} to status ${newStatus}`);
    const item = await this.menuItemModel.findById(itemId);
    if (!item) throw new NotFoundException('Menu item not found');

    const user = await this.usersService.findById(changer.userId);
    if (!user) throw new NotFoundException('User not found');

    const previousStatus = item.stockStatus;
    item.stockStatus = newStatus;
    console.log(`[MenuService] Saving item ${item.name}...`);
    await item.save();

    // Record History
    console.log(`[MenuService] Recording history...`);
    await this.stockHistoryModel.create({
      organizationId: item.organizationId,
      branchId: item.branchId,
      menuItemId: item._id,
      menuItemName: item.name,
      previousStatus,
      newStatus,
      changedByUserId: new Types.ObjectId(changer.userId),
      changedByName: `${user.firstName} ${user.lastName}`,
      changedByRole: changer.role,
      note,
      shiftId: shiftId ? new Types.ObjectId(shiftId) : undefined,
      businessDayId: businessDayId ? new Types.ObjectId(businessDayId) : undefined,
    });

    // Trigger Notifications
    if (newStatus === StockStatus.LOW || newStatus === StockStatus.FINISHED) {
      console.log(`[MenuService] Triggering notifications for ${newStatus} stock...`);
      try {
        const managers = await this.usersService.findManagersByBranch(item.branchId.toString());
        console.log(`[MenuService] Found ${managers.length} managers to notify`);
        const type = newStatus === StockStatus.LOW ? NotificationType.LOW_STOCK : NotificationType.FINISHED_STOCK;
        const title = `${item.name} is running ${newStatus === StockStatus.LOW ? 'low' : 'out'}`;
        const body = `Updated by ${user.firstName} ${user.lastName}. Stock status: ${newStatus}`;

        for (const manager of managers) {
          await this.notificationsService.createNotification({
            organizationId: item.organizationId,
            branchId: item.branchId,
            recipientUserId: manager._id as Types.ObjectId,
            type,
            title,
            body,
          });
        }
        console.log(`[MenuService] Notifications sent`);
      } catch (error) {
        console.error(`[MenuService] Notification error (non-blocking):`, error);
      }
    }

    console.log(`[MenuService] updateStock completed`);
    return item;
  }

  async getStockHistory(itemId: string): Promise<StockHistory[]> {
    return this.stockHistoryModel
      .find({ menuItemId: new Types.ObjectId(itemId) })
      .sort({ createdAt: -1 });
  }

  async getStockOverview(organizationId: string, branchId: string): Promise<any> {
    const items = await this.menuItemModel.find({
      organizationId: new Types.ObjectId(organizationId),
      branchId: new Types.ObjectId(branchId),
      isActive: true,
    });

    const overview = {
      [StockStatus.AVAILABLE]: [],
      [StockStatus.LOW]: [],
      [StockStatus.FINISHED]: [],
    };

    items.forEach((item) => {
      if (overview[item.stockStatus]) {
        overview[item.stockStatus].push(item);
      }
    });

    return overview;
  }
}
