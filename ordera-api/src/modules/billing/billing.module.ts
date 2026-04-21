import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PlatformModule } from '../platform/platform.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [PlatformModule, OrganizationsModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
