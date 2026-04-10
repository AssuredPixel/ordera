import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsMongoId,
  IsArray,
  ValidateNested,
  Min,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, OrderStatus } from '../../../common/enums/order.enum';

// ─── Create Order ─────────────────────────────────────────────────────────────
export class CreateOrderDto {
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Add Item to Order ────────────────────────────────────────────────────────
class AddonInputDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  currency: string;
}

export class AddOrderItemDto {
  @IsMongoId()
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddonInputDto)
  addons?: AddonInputDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Update Status ────────────────────────────────────────────────────────────
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
