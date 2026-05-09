import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

export class CreateBillDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
}

export class ChargeBillDto {
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amountPaid?: number;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  tipType?: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  @IsOptional()
  tipValue?: number;
}
