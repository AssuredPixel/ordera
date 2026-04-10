import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// ─── Embedded: Money ───────────────────────────────────────────────────────────
@Schema({ _id: false })
class Money {
  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, uppercase: true, trim: true })
  currency: string;
}

const MoneySchema = SchemaFactory.createForClass(Money);

// ─── Embedded: Addon ──────────────────────────────────────────────────────────
@Schema({ _id: true })
class Addon {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: MoneySchema, required: true })
  price: Money;

  @Prop()
  imageUrl: string;
}

const AddonSchema = SchemaFactory.createForClass(Addon);

// ─── Root: MenuItem ───────────────────────────────────────────────────────────
@Schema({ timestamps: true })
export class MenuItem extends Document {
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
    ref: 'Category',
    required: true,
    index: true,
  })
  categoryId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ type: MoneySchema, required: true })
  price: Money;

  @Prop({ trim: true })
  weight: string;

  @Prop()
  imageUrl: string;

  @Prop({ type: [AddonSchema], default: [] })
  addons: Addon[];

  @Prop({ default: true })
  inStock: boolean;

  @Prop({ type: Number, default: null })
  stockLevel: number | null;

  @Prop({ type: Number, default: null })
  stockThreshold: number | null;

  @Prop({ default: true })
  isActive: boolean;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

// Compound Indexes for multi-tenant, high-performance queries
MenuItemSchema.index({ organizationId: 1, branchId: 1, categoryId: 1 });
MenuItemSchema.index({ organizationId: 1, branchId: 1, inStock: 1 });

// Exported for use in other modules (e.g. Orders)
export { Money, MoneySchema, Addon, AddonSchema };
