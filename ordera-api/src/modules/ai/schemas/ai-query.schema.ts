import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false })
export class AIContext {
  @Prop({ type: Date, default: Date.now })
  date: Date;

  @Prop()
  userRole: string;

  @Prop()
  branchName: string;

  @Prop({ type: Object }) // embedded Money
  todayRevenue: any;

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
}

@Schema({ timestamps: true })
export class AIQuery extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true, index: true })
  branchId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  query: string;

  @Prop({ type: AIContext })
  context: AIContext;

  @Prop()
  response: string;

  @Prop({ default: 'anthropic/claude-3-sonnet-20240229' })
  aiModel: string;

  @Prop()
  inputTokens: number;

  @Prop()
  outputTokens: number;

  @Prop()
  totalTokens: number;

  @Prop()
  latencyMs: number;

  @Prop({ required: true, enum: ['success', 'error', 'rate_limited'] })
  status: 'success' | 'error' | 'rate_limited';

  @Prop()
  errorMessage: string;
}

export const AIQuerySchema = SchemaFactory.createForClass(AIQuery);

// Indexes for rate limiting and reporting
AIQuerySchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
AIQuerySchema.index({ organizationId: 1, branchId: 1, createdAt: -1 });
