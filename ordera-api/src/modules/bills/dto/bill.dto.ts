import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsMongoId,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../common/enums/bill.enum';

export class CreateBillDto {
  @IsMongoId()
  orderId: string;
}

export class ChargeBillDto {
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsEnum(['percentage', 'fixed'])
  tipType?: 'percentage' | 'fixed';

  @IsOptional()
  @IsNumber()
  @Min(0)
  tipValue?: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

class GuestAllocationDto {
  @IsString()
  guestName: string;

  @IsArray()
  @IsNumber({}, { each: true })
  itemIndexes: number[];
}

export class SplitBillDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestAllocationDto)
  guestAllocations: GuestAllocationDto[];
}
