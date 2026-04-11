import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Customer extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ default: 0 })
  totalOrders: number;

  @Prop({ default: 0 })
  totalSpent: number;

  @Prop({ type: Date })
  lastOrderAt: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// Scoped unique index for phone numbers within an organization
CustomerSchema.index({ organizationId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ organizationId: 1, branchId: 1, createdAt: 1 });
