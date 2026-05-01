import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BillStatus } from '../../../common/enums/bill-status.enum';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';
import { MoneySchema } from '../../../common/schemas/money.schema';
import { Money } from '../../../common/types/money.type';
import { OrderItem, OrderItemSchema } from '../../ordering/schemas/order-item.schema';

@Schema({ _id: false })
class Payment {
  @Prop({ type: String, enum: PaymentMethod, required: true })
  method: PaymentMethod;

  @Prop({ type: MoneySchema, required: true })
  amountPaid: Money;

  @Prop({ type: MoneySchema, required: true })
  change: Money;

  @Prop()
  reference: string;

  @Prop({ default: Date.now })
  processedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedByUserId: Types.ObjectId;
}

@Schema({ _id: false })
class Tip {
  @Prop({ type: String, enum: ['percentage', 'fixed'], required: true })
  type: 'percentage' | 'fixed';

  @Prop({ required: true })
  value: number;

  @Prop({ type: MoneySchema, required: true })
  amount: Money;
}

@Schema({ timestamps: true })
export class Bill extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Order', unique: true })
  orderId: Types.ObjectId;

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

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ type: MoneySchema, required: true })
  subtotal: Money;

  @Prop({ type: MoneySchema, required: true })
  tax: Money;

  @Prop({ type: Tip })
  tip: Tip;

  @Prop({ type: MoneySchema, required: true })
  total: Money;

  @Prop({ type: String, enum: BillStatus, default: BillStatus.ACTIVE })
  status: BillStatus;

  @Prop({ type: Payment })
  payment: Payment;

  @Prop({ type: Types.ObjectId, ref: 'Bill' })
  splitFrom: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Bill' }], default: [] })
  splits: Types.ObjectId[];

  @Prop()
  paidAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Shift' })
  shiftId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BusinessDay' })
  businessDayId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Reconciliation' })
  reconciliationId: Types.ObjectId;
}

export const BillSchema = SchemaFactory.createForClass(Bill);

BillSchema.index({ organizationId: 1, branchId: 1, status: 1 });
BillSchema.index({ organizationId: 1, branchId: 1, waiterId: 1 });
BillSchema.index({ organizationId: 1, branchId: 1, createdAt: -1 });
BillSchema.index({ branchId: 1, waiterId: 1, createdAt: -1 });
BillSchema.index({ branchId: 1, status: 1 });
BillSchema.index({ shiftId: 1 });
BillSchema.index({ businessDayId: 1 });
BillSchema.index({ reconciliationId: 1 });
