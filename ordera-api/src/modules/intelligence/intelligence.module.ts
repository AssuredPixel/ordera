import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';
import { AIQuery, AIQuerySchema } from './schemas/ai-query.schema';
import { Bill, BillSchema } from '../billing/schemas/bill.schema';
import { Order, OrderSchema } from '../ordering/schemas/order.schema';
import { MenuItem, MenuItemSchema } from '../menu/schemas/menu-item.schema';
import { User, UserSchema } from '../users/user.schema';
import { Shift, ShiftSchema } from '../scheduling/shift.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIQuery.name, schema: AIQuerySchema },
      { name: Bill.name, schema: BillSchema },
      { name: Order.name, schema: OrderSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: User.name, schema: UserSchema },
      { name: Shift.name, schema: ShiftSchema },
    ]),
  ],
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
