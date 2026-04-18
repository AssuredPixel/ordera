import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AIUsage extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ required: true })
  month: number; // 1-12

  @Prop({ required: true })
  year: number;

  @Prop({ default: 0 })
  queryCount: number;

  @Prop({ default: 0 })
  totalTokens: number;

  @Prop({ default: 0 })
  estimatedCost: number; // In the platform's base currency (e.g. NGN)
}

export const AIUsageSchema = SchemaFactory.createForClass(AIUsage);

// Compound index for efficient monthly lookups per org
AIUsageSchema.index({ organizationId: 1, year: 1, month: 1 }, { unique: true });
