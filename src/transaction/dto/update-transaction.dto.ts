import { IsOptional, IsEnum } from 'class-validator';
import { PaymentStatus } from '../entities/transaction.entity';

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}