import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, IsPositive } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  costPrice: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  sellingPrice: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  stock: number;

  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsOptional()
  @IsString()
  productCode?: string;

  @IsOptional()
  @IsString()
  description?: string;
}