import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { Category, CategorySchema } from './schemas/category.schema';
import { MenuItem, MenuItemSchema } from './schemas/menu-item.schema';
import { StockHistory, StockHistorySchema } from './schemas/stock-history.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: StockHistory.name, schema: StockHistorySchema },
    ]),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
