import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { SubscriptionStatus } from '../../common/enums/subscription-status.enum';
import { PaymentGateway } from '../../common/enums/payment-gateway.enum';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  organizationId: Types.ObjectId;

  @Prop({ type: String, enum: SubscriptionPlan, required: true })
  plan: SubscriptionPlan;

  @Prop({ type: String, enum: SubscriptionStatus, default: SubscriptionStatus.TRIAL })
  status: SubscriptionStatus;

  @Prop({ type: String, enum: PaymentGateway, required: true })
  gateway: PaymentGateway;

  @Prop()
  gatewayCustomerId: string;

  @Prop({ unique: true, sparse: true })
  gatewaySubscriptionId: string;

  @Prop()
  currentPeriodStart: Date;

  @Prop()
  currentPeriodEnd: Date;

  @Prop({ default: false })
  cancelAtPeriodEnd: boolean;

  @Prop()
  trialEnd: Date;

  @Prop({ default: 0 })
  paymentFailureCount: number;

  @Prop()
  lastPaymentAttempt: Date;

  @Prop()
  notes: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// Explicit Indexes

