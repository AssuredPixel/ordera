import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';
import { Bill, BillSchema } from './schemas/bill.schema';
import { Reconciliation, ReconciliationSchema } from './schemas/reconciliation.schema';
import { Order, OrderSchema } from '../ordering/schemas/order.schema';
import { MessagesModule } from '../messages/messages.module';
import { PlatformModule } from '../platform/platform.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bill.name, schema: BillSchema },
      { name: Reconciliation.name, schema: ReconciliationSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    MessagesModule,
    PlatformModule,
  ],
  controllers: [BillsController, ReconciliationController, BillingController],
  providers: [BillsService, ReconciliationService, BillingService],
  exports: [BillsService, ReconciliationService],
})
export class BillingModule {}
