import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from './subscription.schema';
import { Invoice, InvoiceSchema } from './invoice.schema';
import { AIUsage, AIUsageSchema } from './ai-usage.schema';
import { SubscriptionService } from './subscription.service';
import { InvoiceService } from './invoice.service';
import { AIUsageService } from './ai-usage.service';
import { PlatformSettings, PlatformSettingsSchema } from './platform-settings.schema';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformController } from './platform.controller';
import { Organization, OrganizationSchema } from '../organizations/organization.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: AIUsage.name, schema: AIUsageSchema },
      { name: PlatformSettings.name, schema: PlatformSettingsSchema },
    ]),

  ],
  controllers: [PlatformController],
  providers: [SubscriptionService, InvoiceService, AIUsageService, PlatformSettingsService],
  exports: [SubscriptionService, InvoiceService, AIUsageService, PlatformSettingsService],
})
export class PlatformModule {}
