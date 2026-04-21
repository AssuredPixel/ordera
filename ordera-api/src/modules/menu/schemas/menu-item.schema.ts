import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { StockStatus } from '../../../common/enums/stock-status.enum';
import { MoneySchema } from '../../../common/schemas/money.schema';
import { Money } from '../../../common/types/money.type';

@Schema({ _id: false })
export class AddonSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ type: MoneySchema, required: true })
  price: Money;

  @Prop()
  imageUrl: string;

  @Prop({ default: true })
  isActive: boolean;
}

@Schema({ timestamps: true })
export class MenuItem extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: MoneySchema, required: true })
  price: Money;

  @Prop()
  weight: string;

  @Prop()
  imageUrl: string;

  @Prop({ type: [AddonSchema], default: [] })
  addons: AddonSchema[];

  @Prop({ type: String, enum: StockStatus, default: StockStatus.AVAILABLE })
  stockStatus: StockStatus;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  preparationTime: number; // in minutes
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

// Compound Indexes
MenuItemSchema.index({ organizationId: 1, branchId: 1, categoryId: 1 });
MenuItemSchema.index({ organizationId: 1, branchId: 1, stockStatus: 1 });

// Virtual for isOrderable
MenuItemSchema.virtual('isOrderable').get(function() {
  return this.isActive && this.stockStatus !== StockStatus.FINISHED;
});
