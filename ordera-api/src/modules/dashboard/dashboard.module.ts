import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order, OrderSchema } from '../ordering/schemas/order.schema';
import { Bill, BillSchema } from '../billing/schemas/bill.schema';
import { User, UserSchema } from '../users/user.schema';
import { MenuItem, MenuItemSchema } from '../menu/schemas/menu-item.schema';
import { BusinessDay, BusinessDaySchema } from '../scheduling/business-day.schema';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Bill.name, schema: BillSchema },
      { name: User.name, schema: UserSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: BusinessDay.name, schema: BusinessDaySchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
