import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsMongoId,
  ValidateNested,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class MoneyDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  currency: string;
}

class AddonDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  price: MoneyDto;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateMenuItemDto {
  @IsMongoId()
  categoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => MoneyDto)
  price: MoneyDto;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddonDto)
  addons?: AddonDto[];
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  price?: MoneyDto;

  @IsOptional()
  @IsString()
  weight?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddonDto)
  addons?: AddonDto[];
}

export class UpdateStockDto {
  @IsBoolean()
  inStock: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stockLevel?: number;
}
