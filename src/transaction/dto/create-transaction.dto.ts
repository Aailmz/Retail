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
  
  @IsOptional()
  @IsNumber()
  originalPrice?: number;
  
  @IsOptional()
  @IsNumber()
  markedUpPrice?: number;
  
  @IsOptional()
  @IsNumber()
  discountedPrice?: number;
  
  @IsOptional()
  @IsNumber()
  unitPrice?: number;
  
  @IsOptional()
  @IsNumber()
  markupPercentage?: number;
  
  @IsOptional()
  @IsNumber()
  promotionId?: number;
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
  
  @IsOptional()
  @IsNumber()
  subtotal?: number;
  
  @IsOptional()
  @IsNumber()
  discountAmount?: number;
  
  @IsOptional()
  @IsNumber()
  taxAmount?: number;
  
  @IsOptional()
  @IsNumber()
  grandTotal?: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  note?: string;
}