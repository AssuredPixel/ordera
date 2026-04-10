import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bill, BillSchema } from './schemas/bill.schema';
import { OrdersModule } from '../orders/orders.module';
import { MenuModule } from '../menu/menu.module';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bill.name, schema: BillSchema }]),
    OrdersModule, // provides Order model for snapshot copying
    MenuModule,   // provides Money/OrderItem schema types
  ],
  providers: [BillsService],
  controllers: [BillsController],
  exports: [MongooseModule],
})
export class BillsModule {}

