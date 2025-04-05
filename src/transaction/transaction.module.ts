import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { Transaction } from './entities/transaction.entity';
import { TransactionItem } from './entities/transaction-item.entity';
import { ProductModule } from '../product/product.module';
import { PromotionModule } from '../promotion/promotion.module';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionItem, Product]),
    ProductModule,
    PromotionModule
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService]
})
export class TransactionModule {}

// utils/code-generator.ts
export function generateTransactionCode(): string {
  const prefix = 'TRX';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
}

// update-transaction.dto.ts
import { IsOptional, IsEnum } from 'class-validator';
import { PaymentStatus } from '../entities/transaction.entity';

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}