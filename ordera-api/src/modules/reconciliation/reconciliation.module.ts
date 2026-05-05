import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reconciliation, ReconciliationSchema } from './reconciliation.schema';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';
import { BusinessDay, BusinessDaySchema } from '../scheduling/business-day.schema';
import { Bill, BillSchema } from '../billing/schemas/bill.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reconciliation.name, schema: ReconciliationSchema },
      { name: BusinessDay.name, schema: BusinessDaySchema },
      { name: Bill.name, schema: BillSchema },
    ]),
  ],
  providers: [ReconciliationService],
  controllers: [ReconciliationController],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
