import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { StockStatus } from '../../common/enums/stock-status.enum';

@Controller('menu')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // --- CATEGORIES ---

  @Get('categories')
  async getCategories(
    @GetUser() user: JwtPayload,
    @Query('branchId') branchId?: string
  ) {
    const targetBranchId = branchId || user.branchId;
    return this.menuService.getCategories(user.organizationId, targetBranchId);
  }

  @Post('categories')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async createCategory(@GetUser() user: JwtPayload, @Body() data: any) {
    return this.menuService.createCategory(user.organizationId, user.branchId, data);
  }

  @Patch('categories/:id')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async updateCategory(@Param('id') id: string, @Body() data: any) {
    return this.menuService.updateCategory(id, data);
  }

  @Patch('categories/reorder')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async reorderCategories(@GetUser() user: JwtPayload, @Body('orders') orders: any[]) {
    return this.menuService.reorderCategories(user.organizationId, user.branchId, orders);
  }

  // --- MENU ITEMS ---

  @Get('categories/:id/items')
  async getItemsByCategory(@Param('id') categoryId: string, @GetUser('role') role: string) {
    return this.menuService.getItemsByCategory(categoryId, role);
  }

  @Post('items')
  @Roles(Role.BRANCH_MANAGER, Role.KITCHEN_STAFF, Role.OWNER)
  async createMenuItem(
    @GetUser() user: JwtPayload,
    @Body() data: any,
    @Query('branchId') branchId?: string
  ) {
    const targetBranchId = branchId || user.branchId;
    if (!targetBranchId) throw new UnauthorizedException('Branch ID is required');
    return this.menuService.createMenuItem(user.organizationId, targetBranchId, data);
  }

  @Patch('items/:id')
  @Roles(Role.BRANCH_MANAGER, Role.KITCHEN_STAFF, Role.OWNER)
  async updateMenuItem(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.menuService.updateMenuItem(id, data);
  }

  @Patch('items/:id/deactivate')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async deactivateMenuItem(@Param('id') id: string) {
    return this.menuService.deactivateMenuItem(id);
  }

  // --- STOCK MANAGEMENT ---

  @Patch('items/:id/stock')
  @Roles(Role.BRANCH_MANAGER, Role.KITCHEN_STAFF, Role.OWNER)
  async updateStock(
    @Param('id') id: string,
    @GetUser() user: JwtPayload,
    @Body() body: { status: StockStatus; note?: string; shiftId?: string; businessDayId?: string },
  ) {
    return this.menuService.updateStock(
      id,
      body.status,
      { userId: user.userId, role: user.role as Role },
      body.note,
      body.shiftId,
      body.businessDayId,
    );
  }

  @Get('stock-history/:itemId')
  @Roles(Role.BRANCH_MANAGER, Role.OWNER)
  async getStockHistory(@Param('itemId') itemId: string) {
    return this.menuService.getStockHistory(itemId);
  }

  @Get('stock-overview')
  @Roles(Role.BRANCH_MANAGER, Role.KITCHEN_STAFF, Role.OWNER)
  async getStockOverview(
    @GetUser() user: JwtPayload,
    @Query('branchId') branchId?: string
  ) {
    const targetBranchId = branchId || user.branchId;
    return this.menuService.getStockOverview(user.organizationId, targetBranchId);
  }
}
