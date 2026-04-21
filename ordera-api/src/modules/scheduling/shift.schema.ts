import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ShiftStatus } from '../../common/enums/shift-status.enum';

@Schema({ _id: false })
class Money {
  @Prop({ default: 0 })
  amount: number;

  @Prop({ default: 'NGN' })
  currency: string;
}

@Schema({ timestamps: true })
export class Shift extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ShiftTemplate' })
  templateId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  scheduledStart: Date;

  @Prop({ required: true })
  scheduledEnd: Date;

  @Prop()
  actualStart: Date;

  @Prop()
  actualEnd: Date;

  @Prop({ type: String, enum: ShiftStatus, default: ShiftStatus.SCHEDULED })
  status: ShiftStatus;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  staffOnShift: Types.ObjectId[];

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  totalRevenue: Money;

  @Prop({ default: 0 })
  totalOrders: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  openedByUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedByUserId: Types.ObjectId;
}

export const ShiftSchema = SchemaFactory.createForClass(Shift);

ShiftSchema.index({ branchId: 1, date: 1, status: 1 });
ShiftSchema.index({ branchId: 1, status: 1 });
