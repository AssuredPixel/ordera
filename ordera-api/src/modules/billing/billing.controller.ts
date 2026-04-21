import { 
  Controller, 
  Get,
  Post, 
  Body, 
  UseGuards, 
  Headers, 
  Req, 
  Res,
  HttpStatus,
  RawBodyRequest
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { SubscriptionService } from '../platform/subscription.service';
import { InvoiceService } from '../platform/invoice.service';
import { Request, Response } from 'express';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly subscriptionService: SubscriptionService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Post('paystack/initialize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async initializePaystack(@GetUser() user: JwtPayload, @Body('plan') plan: SubscriptionPlan) {
    return this.billingService.initializePaystackCheckout(user.organizationId as string, plan);
  }

  @Post('stripe/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async initializeStripe(@GetUser() user: JwtPayload, @Body('plan') plan: SubscriptionPlan) {
    return this.billingService.initializeStripeCheckout(user.organizationId as string, plan);
  }

  @Get('owner/usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async getUsage(@GetUser() user: JwtPayload) {
    return this.subscriptionService.getOrganizationUsage(user.organizationId as string);
  }

  @Get('owner/invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  async getInvoices(@GetUser() user: JwtPayload) {
    return this.invoiceService.findByOrganization(user.organizationId as string);
  }

  // --- WEBHOOKS (PUBLIC) ---

  @Public()
  @Post('webhooks/paystack')
  async handlePaystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() body: any,
    @Res() res: Response
  ) {
    const isValid = await this.billingService.verifyPaystackWebhook(body, signature);
    if (!isValid) return res.status(HttpStatus.BAD_REQUEST).send('Invalid signature');

    const event = body.event;
    const data = body.data;
    const orgId = data.metadata?.organizationId;

    if (orgId) {
       const sub = await this.subscriptionService.findByOrganization(orgId);
       
       switch (event) {
         case 'subscription.create':
         case 'invoice.payment_success':
           await this.subscriptionService.activate(sub._id.toString());
           // Log invoice
           await this.invoiceService.create(
             sub._id.toString(), 
             orgId, 
             { amount: data.amount / 100, currency: 'NGN' }, 
             'paystack' as any
           );
           break;
         case 'subscription.disable':
           await this.subscriptionService.expire(sub._id.toString());
           break;
         case 'invoice.payment_failed':
           await this.subscriptionService.markPastDue(sub._id.toString());
           break;
       }
    }

    return res.status(HttpStatus.OK).send('Webhook processed');
  }

  @Public()
  @Post('webhooks/stripe')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
    @Res() res: Response
  ) {
    if (!req.rawBody) return res.status(HttpStatus.BAD_REQUEST).send('No raw body');

    let event;
    try {
      event = await this.billingService.verifyStripeWebhook(req.rawBody, signature);
    } catch (err) {
      return res.status(HttpStatus.BAD_REQUEST).send('Invalid signature');
    }

    const data = event.data.object as any;
    const orgId = data.metadata?.organizationId;

    if (orgId) {
      const sub = await this.subscriptionService.findByOrganization(orgId);

      switch (event.type) {
        case 'customer.subscription.updated':
        case 'invoice.payment_succeeded':
          await this.subscriptionService.activate(sub._id.toString());
          break;
        case 'invoice.payment_failed':
          await this.subscriptionService.markPastDue(sub._id.toString());
          break;
        case 'customer.subscription.deleted':
          await this.subscriptionService.expire(sub._id.toString());
          break;
      }
    }

    return res.status(HttpStatus.OK).send('Webhook processed');
  }
}
