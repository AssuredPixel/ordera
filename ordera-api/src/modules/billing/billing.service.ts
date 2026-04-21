import { Injectable, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from '../platform/subscription.service';
import { InvoiceService } from '../platform/invoice.service';
import { PaymentGateway } from '../../common/enums/payment-gateway.enum';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import axios from 'axios';
const Stripe = require('stripe');
import * as crypto from 'crypto';

@Injectable()
export class BillingService {
  private stripe: any;

  constructor(
    private configService: ConfigService,
    private subscriptionService: SubscriptionService,
    private invoiceService: InvoiceService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeKey || 'sk_test_placeholder', {
      apiVersion: '2025-01-27' as any,
    });
  }

  // --- PAYSTACK LOGIC ---

  async initializePaystackCheckout(orgId: string, plan: SubscriptionPlan) {
    const secretKey = this.configService.get<string>('PAYSTACK_TEST_SECRET_KEY');
    const plans = {
      [SubscriptionPlan.STARTER]: { amount: 490000, name: 'Ordera Starter' }, // kobo
      [SubscriptionPlan.BREAD]: { amount: 990000, name: 'Ordera Growth' },
      [SubscriptionPlan.FEAST]: { amount: 1990000, name: 'Ordera Pro' },
    };

    const targetPlan = plans[plan];
    if (!targetPlan) throw new BadRequestException('Invalid plan');

    try {
      // In a real scenario, we'd sync the plan with Paystack first to get a plan_code
      // For now, we'll initialize a transaction. Paystack handles the subscription if we pass a plan code.
      // We will look up or create the plan on Paystack first.
      const planCode = await this.getOrCreatePaystackPlan(plan, targetPlan.amount, targetPlan.name);

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: `org_${orgId}@ordera.biz`, // Placeholder email or fetch owner email
          amount: targetPlan.amount,
          plan: planCode,
          metadata: { organizationId: orgId, plan: plan },
          callback_url: `${this.configService.get('FRONTEND_URL')}/owner/subscription?status=success`,
        },
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return { authorization_url: response.data.data.authorization_url };
    } catch (error: any) {
      throw new BadRequestException(`Paystack initialization failed: ${error.response?.data?.message || error.message}`);
    }
  }

  private async getOrCreatePaystackPlan(plan: string, amount: number, name: string): Promise<string> {
    const secretKey = this.configService.get<string>('PAYSTACK_TEST_SECRET_KEY');
    try {
      // Check if plan exists
      const listRes = await axios.get('https://api.paystack.co/plan', {
        headers: { Authorization: `Bearer ${secretKey}` },
      });

      const existing = listRes.data.data.find((p: any) => p.name === name);
      if (existing) return existing.plan_code;

      // Create plan
      const createRes = await axios.post(
        'https://api.paystack.co/plan',
        { name, amount, interval: 'monthly' },
        { headers: { Authorization: `Bearer ${secretKey}` } },
      );
      return createRes.data.data.plan_code;
    } catch (error) {
      // Fallback or handle error
      return '';
    }
  }

  async verifyPaystackWebhook(body: any, signature: string): Promise<boolean> {
    const secretKey = this.configService.get<string>('PAYSTACK_TEST_SECRET_KEY');
    const hash = crypto
      .createHmac('sha512', secretKey || '')
      .update(JSON.stringify(body))
      .digest('hex');
    return hash === signature;
  }

  // --- STRIPE LOGIC ---

  async initializeStripeCheckout(orgId: string, plan: SubscriptionPlan) {
    const priceIds = {
      [SubscriptionPlan.STARTER]: this.configService.get('STRIPE_PRICE_STARTER'),
      [SubscriptionPlan.BREAD]: this.configService.get('STRIPE_PRICE_GROWTH'),
      [SubscriptionPlan.FEAST]: this.configService.get('STRIPE_PRICE_PRO'),
    };

    const priceId = priceIds[plan];
    if (!priceId) throw new BadRequestException('Stripe Price ID not configured');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      metadata: { organizationId: orgId, plan: plan },
      success_url: `${this.configService.get('FRONTEND_URL')}/owner/subscription?status=success`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/owner/subscription?status=cancel`,
    });

    return { url: session.url };
  }

  async verifyStripeWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret || '');
    } catch (err) {
      throw new BadRequestException('Invalid Stripe signature');
    }
  }
}
