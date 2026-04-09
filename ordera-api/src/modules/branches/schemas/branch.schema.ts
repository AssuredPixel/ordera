import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
class BranchAddress {
  @Prop()
  street: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  country: string;

  @Prop()
  postalCode: string;
}

@Schema({ _id: false })
class BranchSettings {
  @Prop({ default: 0 })
  taxRate: number;

  @Prop({ default: true })
  acceptsCash: boolean;

  @Prop({ default: true })
  acceptsCard: boolean;

  @Prop({ default: '' })
  receiptFooter: string;

  @Prop({ default: true })
  savePaymentHistory: boolean;
}

@Schema({ timestamps: true })
export class Branch extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ type: BranchAddress })
  address: BranchAddress;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop()
  timezone: string;

  @Prop()
  currency: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: BranchSettings, default: () => ({}) })
  settings: BranchSettings;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

// Compound Indexes
BranchSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
BranchSchema.index({ organizationId: 1, isActive: 1 });
