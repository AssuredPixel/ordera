import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  tableNumber?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  guestCount?: number;

  @IsString()
  @IsOptional()
  customerName?: string;
}

export class AddOrderItemDto {
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsArray()
  @IsOptional()
  selectedAddons?: string[];

  @IsString()
  @IsOptional()
  notes?: string;
}
