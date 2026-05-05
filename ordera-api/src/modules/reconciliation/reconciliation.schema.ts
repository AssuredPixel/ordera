import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReconciliationStatus } from '../../common/enums/reconciliation-status.enum';
import { ReconciliationLineStatus } from '../../common/enums/reconciliation-line-status.enum';

@Schema({ _id: false })
class Money {
  @Prop({ default: 0 })
  amount: number;

  @Prop({ default: 'NGN' })
  currency: string;
}

@Schema({ _id: false })
export class ReconciliationLine {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  waiterId: Types.ObjectId;

  @Prop({ required: true })
  waiterName: string;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  expectedCash: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  expectedCard: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  expectedTransfer: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  expectedTotal: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  actualCash: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  actualCard: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  actualTransfer: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  actualTotal: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  discrepancy: Money;

  @Prop({ type: String, enum: ReconciliationLineStatus, default: ReconciliationLineStatus.PENDING })
  status: ReconciliationLineStatus;

  @Prop()
  flagReason?: string;
}

@Schema({ timestamps: true })
export class Reconciliation extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'BusinessDay' })
  businessDayId: Types.ObjectId;

  @Prop({ required: true })
  businessDayName: string; // e.g., "May 1st, 2026"

  @Prop({ type: String, enum: ReconciliationStatus, default: ReconciliationStatus.OPEN })
  status: ReconciliationStatus;

  @Prop({ type: [ReconciliationLine], default: [] })
  lines: ReconciliationLine[];

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  totalExpected: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  totalActual: Money;

  @Prop({ type: Money, default: () => ({ amount: 0, currency: 'NGN' }) })
  totalDiscrepancy: Money;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  openedByUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedByUserId: Types.ObjectId;
}

export const ReconciliationSchema = SchemaFactory.createForClass(Reconciliation);

ReconciliationSchema.index({ branchId: 1, status: 1 });
ReconciliationSchema.index({ businessDayId: 1 });
