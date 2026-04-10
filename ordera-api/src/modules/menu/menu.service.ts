import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { MenuItem } from './schemas/menu-item.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  UpdateStockDto,
} from './dto/menu-item.dto';

/**
 * Generates a URL-safe slug from a display name.
 * e.g. "Cold Drinks" → "cold-drinks"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItem>,
  ) {}

  // ─── Categories ─────────────────────────────────────────────────────────────

  async getCategories(organizationId: string, branchId: string) {
    return this.categoryModel
      .find({ organizationId, branchId, isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
  }

  async createCategory(
    organizationId: string,
    branchId: string,
    dto: CreateCategoryDto,
  ) {
    const slug = slugify(dto.name);
    const category = new this.categoryModel({
      ...dto,
      slug,
      organizationId,
      branchId,
    });
    return category.save();
  }

  // ─── Menu Items ──────────────────────────────────────────────────────────────

  async getItemsByCategory(
    organizationId: string,
    branchId: string,
    categoryId: string,
  ) {
    // Verify category belongs to this branch first
    const category = await this.categoryModel.findOne({
      _id: categoryId,
      organizationId,
      branchId,
    });
    if (!category) {
      throw new NotFoundException('Category not found in this branch');
    }

    return this.menuItemModel
      .find({ organizationId, branchId, categoryId, isActive: true })
      .lean();
  }

  async createMenuItem(
    organizationId: string,
    branchId: string,
    dto: CreateMenuItemDto,
  ) {
    // Validate categoryId belongs to the same branch
    const category = await this.categoryModel.findOne({
      _id: dto.categoryId,
      organizationId,
      branchId,
    });
    if (!category) {
      throw new BadRequestException(
        'categoryId does not belong to this branch',
      );
    }

    const item = new this.menuItemModel({ ...dto, organizationId, branchId });
    return item.save();
  }

  async updateMenuItem(
    organizationId: string,
    branchId: string,
    itemId: string,
    dto: UpdateMenuItemDto,
  ) {
    const item = await this.menuItemModel.findOneAndUpdate(
      { _id: itemId, organizationId, branchId, isActive: true },
      { $set: dto },
      { new: true, runValidators: true },
    );
    if (!item) {
      throw new NotFoundException('Menu item not found in this branch');
    }
    return item;
  }

  async updateStock(
    organizationId: string,
    branchId: string,
    itemId: string,
    dto: UpdateStockDto,
  ) {
    const update: Record<string, any> = { inStock: dto.inStock };
    if (dto.stockLevel !== undefined) {
      update.stockLevel = dto.stockLevel;
    }

    const item = await this.menuItemModel.findOneAndUpdate(
      { _id: itemId, organizationId, branchId },
      { $set: update },
      { new: true },
    );
    if (!item) {
      throw new NotFoundException('Menu item not found in this branch');
    }
    return item;
  }

  async softDeleteItem(
    organizationId: string,
    branchId: string,
    itemId: string,
  ) {
    const item = await this.menuItemModel.findOneAndUpdate(
      { _id: itemId, organizationId, branchId, isActive: true },
      { $set: { isActive: false } },
      { new: true },
    );
    if (!item) {
      throw new NotFoundException('Menu item not found in this branch');
    }
    return { message: 'Item removed from menu', id: item._id };
  }
}
