import { IsNotEmpty, IsString, IsEnum, IsDate, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreatePromotionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(['buy_x_get_y', 'discount_percentage', 'bundle'])
  promotionType: string;

  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;

  @IsNotEmpty()
  @IsEnum(['active', 'inactive', 'scheduled', 'expired'])
  status: string;

  @IsNotEmpty()
  @IsNumber()
  markupPercentage: number;

  @IsNotEmpty()
  @IsNumber()
  targetMargin: number;

  @IsOptional()
  @IsObject()
  rules: any;

  @IsOptional()
  @IsObject()
  configuration: any;
}