import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from '../../common/enums/notification-type.enum';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  recipientUserId: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: Types.ObjectId, ref: 'Order' })
  relatedOrderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MenuItem' })
  relatedMenuItemId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Thread' })
  relatedThreadId: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ branchId: 1, type: 1, createdAt: -1 });
