import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { MenuItem, MenuItemSchema } from './schemas/menu-item.schema';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
  ],
  providers: [MenuService],
  controllers: [MenuController],
  exports: [MongooseModule],
})
export class MenuModule {}



