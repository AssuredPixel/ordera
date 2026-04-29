import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderingService } from './ordering.service';
import { OrderingController } from './ordering.controller';
import { OrderingGateway } from './ordering.gateway';
import { Order, OrderSchema } from './schemas/order.schema';
import { MenuItem, MenuItemSchema } from '../menu/schemas/menu-item.schema';
import { BusinessDay, BusinessDaySchema } from '../scheduling/business-day.schema';
import { Shift, ShiftSchema } from '../scheduling/shift.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';
import { Branch, BranchSchema } from '../branches/branch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: BusinessDay.name, schema: BusinessDaySchema },
      { name: Shift.name, schema: ShiftSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
    NotificationsModule,
    MessagesModule,
  ],
  controllers: [OrderingController],
  providers: [OrderingService, OrderingGateway],
  exports: [OrderingService],
})
export class OrderingModule {}
