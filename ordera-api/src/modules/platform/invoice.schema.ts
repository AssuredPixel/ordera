import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { PaymentGateway } from '../../common/enums/payment-gateway.enum';
import { Money } from '../../common/types/money.type';

@Schema({ _id: false })
class MoneySchema {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;
}

@Schema({ timestamps: true })
export class Invoice extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Subscription', required: true, index: true })
  subscriptionId: Types.ObjectId;

  @Prop({ type: String, enum: SubscriptionPlan, required: true })
  plan: SubscriptionPlan;

  @Prop({ type: String, enum: PaymentGateway, required: true })
  gateway: PaymentGateway;

  @Prop()
  gatewayInvoiceId: string;

  @Prop()
  gatewayPaymentReference: string;

  @Prop({ type: MoneySchema, required: true })
  amount: Money;

  @Prop({ required: true })
  status: 'paid' | 'failed' | 'pending' | 'refunded';

  @Prop()
  paidAt: Date;

  @Prop()
  failureReason: string;

  @Prop()
  periodStart: Date;

  @Prop()
  periodEnd: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

// Explicit Indexes
InvoiceSchema.index({ organizationId: 1, createdAt: -1 });
