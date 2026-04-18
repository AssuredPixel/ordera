import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Invoice } from './invoice.schema';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { PaymentGateway } from '../../common/enums/payment-gateway.enum';
import { Money } from '../../common/types/money.type';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<Invoice>,
  ) {}

  async create(subscriptionId: string, orgId: string, amount: Money, gateway: PaymentGateway): Promise<Invoice> {
    // Need to find subscription first to get the plan (for consistency)
    // Or just pass the plan. For now simplified as requested.
    return this.invoiceModel.create({
      subscriptionId: new Types.ObjectId(subscriptionId),
      organizationId: new Types.ObjectId(orgId),
      amount,
      gateway,
      plan: SubscriptionPlan.STARTER, // Default or passed in
      status: 'pending',
    });
  }

  async markPaid(invoiceId: string, reference: string): Promise<Invoice> {
    const invoice = await this.invoiceModel.findByIdAndUpdate(
      invoiceId,
      { 
        $set: { status: 'paid', gatewayPaymentReference: reference, paidAt: new Date() } 
      },
      { new: true },
    );
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async markFailed(invoiceId: string, reason: string): Promise<Invoice> {
    return this.invoiceModel.findByIdAndUpdate(
      invoiceId,
      { $set: { status: 'failed', failureReason: reason } },
      { new: true },
    );
  }

  async findByOrganization(orgId: string, limit = 10): Promise<Invoice[]> {
    return this.invoiceModel
      .find({ organizationId: new Types.ObjectId(orgId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}
