import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { PaymentMethod, BillStatus } from '../../../common/enums/bill.enum';
import { Money, MoneySchema } from '../../menu/schemas/menu-item.schema';
import { OrderItemSchema, OrderItem } from '../../orders/schemas/order.schema';

// ─── Embedded: Payment ────────────────────────────────────────────────────────
// Recorded once at the moment the customer pays — immutable after that
@Schema({ _id: false })
class Payment {
  @Prop({ required: true, enum: Object.values(PaymentMethod) })
  method: PaymentMethod;

  @Prop({ type: MoneySchema, required: true })
  amountPaid: Money;

  // Cash only — difference between amountPaid and total
  @Prop({ type: MoneySchema, default: null })
  change: Money | null;

  // Card / transfer terminal reference number
  @Prop()
  reference: string;

  @Prop({ type: Date, default: Date.now })
  processedAt: Date;
}

const PaymentSchema = SchemaFactory.createForClass(Payment);

// ─── Embedded: Tip ────────────────────────────────────────────────────────────
@Schema({ _id: false })
class Tip {
  // 'percentage' → value is e.g. 10 (meaning 10%)
  // 'fixed' → value is amount in subunits e.g. 50000 (₦500)
  @Prop({ required: true, enum: ['percentage', 'fixed'] })
  type: 'percentage' | 'fixed';

  @Prop({ required: true, min: 0 })
  value: number;

  // Pre-calculated tip amount in subunits — stored for fast reporting
  @Prop({ type: MoneySchema, required: true })
  amount: Money;
}

const TipSchema = SchemaFactory.createForClass(Tip);

// ─── Root: Bill ───────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Bill extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  })
  organizationId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Branch',
    required: true,
    index: true,
  })
  branchId: string;

  // Each order can only have ONE bill — enforced by unique index below
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Order',
    required: true,
  })
  orderId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  staffId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer', default: null })
  customerId: string | null;

  @Prop({ type: String, default: null })
  tableNumber: string | null;

  @Prop({ default: 1 })
  guestCount: number;

  @Prop()
  customerName: string;

  // Full snapshot of the order items at bill-creation time
  // Copied from Order — decoupled from live order state
  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({ type: MoneySchema, required: true })
  subtotal: Money;

  @Prop({ type: MoneySchema, required: true })
  tax: Money;

  // null until a tip is applied
  @Prop({ type: TipSchema, default: null })
  tip: Tip | null;

  @Prop({ type: MoneySchema, required: true })
  total: Money;

  @Prop({
    required: true,
    enum: Object.values(BillStatus),
    default: BillStatus.ACTIVE,
  })
  status: BillStatus;

  // null until payment is processed
  @Prop({ type: PaymentSchema, default: null })
  payment: Payment | null;

  // Points to parent bill if this is a split child
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Bill',
    default: null,
  })
  splitFrom: string | null;

  // Child bill IDs if this bill was split (parent has these)
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Bill' }], default: [] })
  splits: string[];

  // Stamped when payment is processed
  @Prop({ type: Date, default: null })
  paidAt: Date | null;
}

export const BillSchema = SchemaFactory.createForClass(Bill);

// Compound indexes for reporting and POS queries
BillSchema.index({ organizationId: 1, branchId: 1, status: 1, paidAt: -1 });
BillSchema.index({ organizationId: 1, branchId: 1, createdAt: -1 });

// One bill per order — enforced at DB level
BillSchema.index({ orderId: 1 }, { unique: true });

// Export sub-schemas for potential reuse
export { Payment, PaymentSchema, Tip, TipSchema };
