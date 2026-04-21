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

  async createNotification(data: {
    organizationId: string | Types.ObjectId;
    branchId: string | Types.ObjectId;
    userId: string | Types.ObjectId;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, any>;
  }) {
    const notification = new this.notificationModel({
      ...data,
      organizationId: new Types.ObjectId(data.organizationId),
      branchId: new Types.ObjectId(data.branchId),
      userId: new Types.ObjectId(data.userId),
    });
    return notification.save();
  }

  async markAsRead(notificationId: string) {
    return this.notificationModel.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true },
    );
  }

  async getUserNotifications(userId: string) {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);
  }
}
