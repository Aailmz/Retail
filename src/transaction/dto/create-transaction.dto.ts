import { IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, ValidateNested, IsArray, IsEmail, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/transaction.entity';

export class CreateTransactionItemDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;
}

export class CreateTransactionDto {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsPhoneNumber()
  customerPhone?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[];

  @IsOptional()
  @IsNumber()
  promotionId?: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  note?: string;
}