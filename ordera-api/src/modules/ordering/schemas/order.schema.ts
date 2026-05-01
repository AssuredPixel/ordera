import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { OrderType } from '../../../common/enums/order-type.enum';
import { MoneySchema } from '../../../common/schemas/money.schema';
import { Money } from '../../../common/types/money.type';
import { OrderItem, OrderItemSchema } from './order-item.schema';

@Schema({ _id: false })
class DeliveryInfo {
  @Prop({ required: true })
  address: string;

  @Prop()
  customerPhone: string;

  @Prop()
  deliveryNotes: string;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  waiterId: Types.ObjectId;

  @Prop({ required: true })
  waiterName: string;

  @Prop()
  tableNumber: string;

  @Prop({ default: 1 })
  guestCount: number;

  @Prop()
  customerName: string;

  @Prop({ type: String, enum: OrderType, default: OrderType.DINE_IN })
  orderType: OrderType;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ type: MoneySchema, required: true })
  subtotal: Money;

  @Prop({ type: MoneySchema, required: true })
  tax: Money;

  @Prop({ type: MoneySchema, required: true })
  total: Money;

  @Prop()
  kitchenNote: string;

  @Prop({ type: Types.ObjectId, ref: 'Shift' })
  shiftId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BusinessDay' })
  businessDayId: Types.ObjectId;

  @Prop()
  sentToKitchenAt: Date;

  @Prop()
  readyAt: Date;

  @Prop()
  pickedUpAt: Date;

  @Prop()
  servedAt: Date;

  @Prop({ type: DeliveryInfo })
  deliveryInfo: DeliveryInfo;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ organizationId: 1, branchId: 1, status: 1 });
OrderSchema.index({ organizationId: 1, branchId: 1, waiterId: 1 });
OrderSchema.index({ organizationId: 1, branchId: 1, createdAt: -1 });
 OrderSchema.index({ branchId: 1, status: 1 });
OrderSchema.index({ branchId: 1, waiterId: 1, createdAt: -1 });
OrderSchema.index({ shiftId: 1 });
OrderSchema.index({ businessDayId: 1 });
