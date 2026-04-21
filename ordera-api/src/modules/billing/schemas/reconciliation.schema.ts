import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ReconciliationStatus } from '../../../common/enums/reconciliation-status.enum';
import { MoneySchema } from '../../../common/schemas/money.schema';
import { Money } from '../../../common/types/money.type';

@Schema({ _id: false })
export class ReconciliationLine {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  waiterId: Types.ObjectId;

  @Prop({ required: true })
  waiterName: string;

  // Expected from bills
  @Prop({ type: MoneySchema, required: true })
  expectedCash: Money;
  @Prop({ type: MoneySchema, required: true })
  expectedCard: Money;
  @Prop({ type: MoneySchema, required: true })
  expectedTransfer: Money;

  // Entered by cashier
  @Prop({ type: MoneySchema, required: true })
  actualCash: Money;
  @Prop({ type: MoneySchema, required: true })
  actualCard: Money;
  @Prop({ type: MoneySchema, required: true })
  actualTransfer: Money;

  @Prop({ type: MoneySchema, required: true })
  cashDiscrepancy: Money;
  @Prop({ type: MoneySchema, required: true })
  cardDiscrepancy: Money;
  @Prop({ type: MoneySchema, required: true })
  transferDiscrepancy: Money;

  @Prop({ type: MoneySchema, required: true })
  totalExpected: Money;
  @Prop({ type: MoneySchema, required: true })
  totalActual: Money;
  @Prop({ type: MoneySchema, required: true })
  totalDiscrepancy: Money;

  @Prop({ default: false })
  hasDiscrepancy: boolean;

  @Prop()
  note: string;

  @Prop({ type: String, enum: ['pending', 'verified', 'flagged'], default: 'pending' })
  status: 'pending' | 'verified' | 'flagged';
}

export const ReconciliationLineSchema = SchemaFactory.createForClass(ReconciliationLine);

@Schema({ timestamps: true })
export class Reconciliation extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: String, enum: ['shift', 'day'], required: true })
  period: 'shift' | 'day';

  @Prop({ type: Types.ObjectId, ref: 'Shift', unique: true, sparse: true })
  shiftId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BusinessDay', unique: true, sparse: true })
  businessDayId: Types.ObjectId;

  @Prop({ type: String, enum: ReconciliationStatus, default: ReconciliationStatus.OPEN })
  status: ReconciliationStatus;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  performedByUserId: Types.ObjectId;

  @Prop({ type: [ReconciliationLineSchema], default: [] })
  lines: ReconciliationLine[];

  @Prop({ type: MoneySchema, required: true })
  totalExpected: Money;

  @Prop({ type: MoneySchema, required: true })
  totalActual: Money;

  @Prop({ type: MoneySchema, required: true })
  totalDiscrepancy: Money;

  @Prop({ default: false })
  hasDiscrepancy: boolean;

  @Prop({ default: Date.now })
  openedAt: Date;

  @Prop()
  completedAt: Date;

  @Prop()
  notes: string;
}

export const ReconciliationSchema = SchemaFactory.createForClass(Reconciliation);

ReconciliationSchema.index({ branchId: 1, status: 1 });
