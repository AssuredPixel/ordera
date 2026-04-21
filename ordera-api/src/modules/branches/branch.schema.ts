import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OperatingMode } from '../../common/enums/operating-mode.enum';

@Schema({ _id: false })
class Address {
  @Prop()
  street: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop({ default: 'NG' })
  country: string;

  @Prop({ required: false })
  postalCode?: string;
}

@Schema({ _id: false })
class BranchSettings {
  @Prop({ default: 0 })
  taxRate: number;

  @Prop({ default: true })
  acceptsCash: boolean;

  @Prop({ default: true })
  acceptsCard: boolean;

  @Prop({ default: true })
  acceptsTransfer: boolean;

  @Prop()
  transferAccountName: string;

  @Prop()
  transferAccountNumber: string;

  @Prop()
  transferBankName: string;

  @Prop()
  receiptHeader: string;

  @Prop({ default: 'Thank you for dining with us!' })
  receiptFooter: string;

  @Prop({ default: true })
  savePaymentHistory: boolean;
}

@Schema({ timestamps: true })
export class Branch extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Address, default: () => ({}) })
  address: Address;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ default: 'Africa/Lagos' })
  timezone: string;

  @Prop({ default: 'NGN' })
  currency: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isHeadquarters: boolean;

  @Prop({ type: String, enum: OperatingMode, default: OperatingMode.DAY_BASED })
  operatingMode: OperatingMode;

  @Prop({ default: 'per_day' })
  reconciliationMode: string;

  @Prop({ type: BranchSettings, default: () => ({}) })
  settings: BranchSettings;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);

BranchSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
BranchSchema.index({ organizationId: 1, isActive: 1 });
BranchSchema.index({ organizationId: 1, isHeadquarters: 1 });
