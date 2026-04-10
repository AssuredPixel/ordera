import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderType, OrderStatus } from '../../../common/enums/order.enum';
import { Money, MoneySchema } from '../../menu/schemas/menu-item.schema';

// ─── Embedded: OrderAddon ─────────────────────────────────────────────────────
// Snapshot of an addon at order time — immune to future price changes
@Schema({ _id: false })
class OrderAddon {
  @Prop({ required: true })
  name: string;

  @Prop({ type: MoneySchema, required: true })
  price: Money;
}

const OrderAddonSchema = SchemaFactory.createForClass(OrderAddon);

// ─── Embedded: OrderItem ──────────────────────────────────────────────────────
// Full snapshot of the ordered item — price history is preserved forever
@Schema({ _id: true })
class OrderItem {
  // Reference only for reporting; item details are fully captured below
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'MenuItem' })
  menuItemId: string;

  // Captured at order time — never changes even if menu price changes later
  @Prop({ required: true })
  name: string;

  @Prop({ type: MoneySchema, required: true })
  unitPrice: Money;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ type: [OrderAddonSchema], default: [] })
  addons: OrderAddon[];

  // Pre-calculated: (unitPrice.amount * quantity) + sum(addon prices)
  // Avoids recomputing on every read
  @Prop({ type: MoneySchema, required: true })
  lineTotal: Money;

  @Prop()
  notes: string;
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

// ─── Root: Order ──────────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class Order extends Document {
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

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  staffId: string;

  // null for delivery/takeaway orders
  @Prop({ type: String, default: null })
  tableNumber: string | null;

  @Prop({ default: 1, min: 1 })
  guestCount: number;

  @Prop()
  customerName: string;

  @Prop({
    required: true,
    enum: Object.values(OrderType),
    default: OrderType.DINE_IN,
  })
  orderType: OrderType;

  @Prop({
    required: true,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
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
  notes: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Compound indexes for multi-tenant order querying
OrderSchema.index({ organizationId: 1, branchId: 1, status: 1 });
OrderSchema.index({ organizationId: 1, branchId: 1, createdAt: -1 });
OrderSchema.index({ organizationId: 1, branchId: 1, staffId: 1 });

// Export sub-schemas for use in the bills module
export { OrderItem, OrderItemSchema, OrderAddon, OrderAddonSchema };
