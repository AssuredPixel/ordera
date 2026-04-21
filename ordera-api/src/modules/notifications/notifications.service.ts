import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './notification.schema';
import { NotificationType } from '../../common/enums/notification-type.enum';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async createNotification(data: Partial<Notification>) {
    return this.notificationModel.create(data);
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.notificationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(notificationId), recipientUserId: new Types.ObjectId(userId) },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { recipientUserId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } },
    );
  }

  async getUnreadNotifications(userId: string) {
    return this.notificationModel
      .find({ recipientUserId: new Types.ObjectId(userId), isRead: false })
      .sort({ createdAt: -1 });
  }

  async getAllNotifications(userId: string, limit = 20, skip = 0) {
    return this.notificationModel
      .find({ recipientUserId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({
      recipientUserId: new Types.ObjectId(userId),
      isRead: false,
    });
  }
}
