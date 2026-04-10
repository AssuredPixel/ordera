import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIQuery, AIQuerySchema } from './schemas/ai-query.schema';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { OrdersModule } from '../orders/orders.module';
import { BillsModule } from '../bills/bills.module';
import { UsersModule } from '../users/users.module';
import { MenuModule } from '../menu/menu.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AIQuery.name, schema: AIQuerySchema }]),
    OrdersModule,
    BillsModule,
    UsersModule,
    MenuModule,
    BranchesModule,
  ],
  providers: [AIService],
  controllers: [AIController],
  exports: [AIService],
})
export class AIModule {}
