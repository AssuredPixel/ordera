import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WaiterController } from './waiter.controller';
import { WaiterService } from './waiter.service';
import { Order, OrderSchema } from '../ordering/schemas/order.schema';
import { Bill, BillSchema } from '../billing/schemas/bill.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Bill.name, schema: BillSchema },
    ]),
  ],
  controllers: [WaiterController],
  providers: [WaiterService],
})
export class WaiterModule {}
