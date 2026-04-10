import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { MenuModule } from '../menu/menu.module';
import { BranchesModule } from '../branches/branches.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    MenuModule,     // provides MenuItem model for price snapshots
    BranchesModule, // provides Branch model for taxRate lookup
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [MongooseModule],
})
export class OrdersModule {}


