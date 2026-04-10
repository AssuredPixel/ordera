import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  UpdateStockDto,
} from './dto/menu-item.dto';

@Controller('menu')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ─── Categories ─────────────────────────────────────────────────────────────

  @Get('categories')
  getCategories(@GetUser() user: any) {
    return this.menuService.getCategories(user.organizationId, user.branchId);
  }

  @Post('categories')
  @Roles(Role.OWNER, Role.MANAGER)
  createCategory(@GetUser() user: any, @Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(
      user.organizationId,
      user.branchId,
      dto,
    );
  }

  // ─── Menu Items ──────────────────────────────────────────────────────────────

  @Get('categories/:id/items')
  getItemsByCategory(@GetUser() user: any, @Param('id') categoryId: string) {
    return this.menuService.getItemsByCategory(
      user.organizationId,
      user.branchId,
      categoryId,
    );
  }

  @Post('items')
  @Roles(Role.OWNER, Role.MANAGER)
  createMenuItem(@GetUser() user: any, @Body() dto: CreateMenuItemDto) {
    return this.menuService.createMenuItem(
      user.organizationId,
      user.branchId,
      dto,
    );
  }

  @Patch('items/:id')
  @Roles(Role.OWNER, Role.MANAGER)
  updateMenuItem(
    @GetUser() user: any,
    @Param('id') itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateMenuItem(
      user.organizationId,
      user.branchId,
      itemId,
      dto,
    );
  }

  @Patch('items/:id/stock')
  @Roles(Role.OWNER, Role.MANAGER, Role.SUPERVISOR)
  updateStock(
    @GetUser() user: any,
    @Param('id') itemId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.menuService.updateStock(
      user.organizationId,
      user.branchId,
      itemId,
      dto,
    );
  }

  @Delete('items/:id')
  @Roles(Role.OWNER, Role.MANAGER)
  softDeleteItem(@GetUser() user: any, @Param('id') itemId: string) {
    return this.menuService.softDeleteItem(
      user.organizationId,
      user.branchId,
      itemId,
    );
  }
}
