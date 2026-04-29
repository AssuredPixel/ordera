import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MoneySchema } from '../../../common/schemas/money.schema';
import { Money } from '../../../common/types/money.type';

@Schema({ _id: false })
export class AIContext {
  @Prop({ required: true })
  queryDate: Date;

  @Prop({ required: true })
  userRole: string;

  @Prop({ required: true })
  branchName: string;

  @Prop()
  periodLabel: string;

  @Prop({ type: MoneySchema })
  todayRevenue: Money;

  @Prop()
  todayOrderCount: number;

  @Prop()
  activeOrderCount: number;

  @Prop()
  staffOnShift: number;

  @Prop()
  topItemToday: string;

  @Prop({ type: [String], default: [] })
  lowStockItems: string[];

  @Prop({ type: [String], default: [] })
  finishedStockItems: string[];

  @Prop({ default: false })
  pendingReconciliation: boolean;
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class AIQuery extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Organization' })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Branch' })
  branchId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  query: string;

  @Prop({ type: AIContext, required: true })
  context: AIContext;

  @Prop()
  response: string;

  @Prop({ default: 'anthropic/claude-3.5-sonnet' })
  aiModel: string;

  @Prop()
  inputTokens: number;

  @Prop()
  outputTokens: number;

  @Prop()
  totalTokens: number;

  @Prop()
  estimatedCostNaira: number;

  @Prop()
  latencyMs: number;

  @Prop({ required: true, enum: ['success', 'error', 'rate_limited'] })
  status: 'success' | 'error' | 'rate_limited';

  @Prop()
  errorMessage: string;
}

export const AIQuerySchema = SchemaFactory.createForClass(AIQuery);

AIQuerySchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
AIQuerySchema.index({ organizationId: 1, branchId: 1, createdAt: -1 });
