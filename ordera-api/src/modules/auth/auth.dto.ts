import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, Matches } from 'class-validator';
import { SubscriptionPlan } from '../../common/enums/subscription-plan.enum';
import { PaymentGateway } from '../../common/enums/payment-gateway.enum';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is too weak. Must contain uppercase, lowercase, and a number or special character.',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @IsString()
  @IsOptional()
  deviceName?: string;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  deviceName?: string;
}
