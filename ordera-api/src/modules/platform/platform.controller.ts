import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { InvoiceService } from './invoice.service';
import { AIUsageService } from './ai-usage.service';
import { PlatformSettingsService } from './platform-settings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { PaymentGateway } from '../../common/enums/payment-gateway.enum';

@Controller('platform')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlatformController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly invoiceService: InvoiceService,
    private readonly aiUsageService: AIUsageService,
    private readonly settingsService: PlatformSettingsService,
  ) {}

  @Get('settings')
  @Roles(Role.SUPER_ADMIN)
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch('settings')
  @Roles(Role.SUPER_ADMIN)
  async updateSettings(@Body() body: any) {
    return this.settingsService.updateSettings(body);
  }

  @Public()
  @Get('public/plans')
  async getPublicPlans() {
    return this.settingsService.getPublicPlans();
  }

  @Public()
  @Get('public/announcement')
  async getPublicAnnouncement() {
    return this.settingsService.getAnnouncement();
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN)
  async getStats() {
    return this.subscriptionService.getStats();
  }

  @Get('ai-usage')
  @Roles(Role.SUPER_ADMIN)
  async getAIUsage(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.aiUsageService.getPlatformStats(page, limit, search);
  }

  // 1. GET /api/platform/subscriptions — super admin only

  @Get('subscriptions')
  @Roles(Role.SUPER_ADMIN)
  async getAllSubscriptions(
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
    @Query('gateway') gateway?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.subscriptionService.findAllFiltered({ search, plan, status, gateway, page, limit });
  }

  // 2. GET /api/platform/subscriptions/:orgId — super admin only
  @Get('subscriptions/:orgId')
  @Roles(Role.SUPER_ADMIN)
  async getSubscription(@Param('orgId') orgId: string) {
    return this.subscriptionService.findByOrganization(orgId);
  }

  // 3. GET /api/platform/invoices/:orgId — super admin only
  @Get('invoices/:orgId')
  @Roles(Role.SUPER_ADMIN)
  async getInvoices(@Param('orgId') orgId: string, @Query('limit') limit?: number) {
    return this.invoiceService.findByOrganization(orgId, limit);
  }

  // 4. POST /api/platform/subscriptions — create subscription for org
  @Post('subscriptions')
  async createSubscription(@Body() body: { orgId: string; plan: SubscriptionPlan; gateway: PaymentGateway }) {
    return this.subscriptionService.create(body.orgId, body.plan, body.gateway);
  }

  // 5. PATCH /api/platform/subscriptions/:id/activate
  @Patch('subscriptions/:id/activate')
  @Roles(Role.SUPER_ADMIN)
  async activate(@Param('id') id: string) {
    return this.subscriptionService.activate(id);
  }

  // 6. PATCH /api/platform/subscriptions/:id/suspend
  @Patch('subscriptions/:id/suspend')
  @Roles(Role.SUPER_ADMIN)
  async suspend(@Param('id') id: string, @Body('note') note: string) {
    return this.subscriptionService.suspend(id, note);
  }

  // 7. PATCH /api/platform/subscriptions/:id/cancel
  @Patch('subscriptions/:id/cancel')
  async cancel(@Param('id') id: string) {
    return this.subscriptionService.cancel(id);
  }

  @Patch('subscriptions/:id/force-plan')
  @Roles(Role.SUPER_ADMIN)
  async forceUpdatePlan(@Param('id') id: string, @Body('plan') plan: SubscriptionPlan) {
    return this.subscriptionService.forceUpdatePlan(id, plan);
  }

  @Patch('subscriptions/:id/extend')
  @Roles(Role.SUPER_ADMIN)
  async extend(@Param('id') id: string, @Body('days') days: number, @Body('note') note?: string) {
    return this.subscriptionService.extend(id, days, note);
  }
}
