import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { Transaction } from './entities/transaction.entity';
import { TransactionItem } from './entities/transaction-item.entity';
import { ProductModule } from '../product/product.module';
import { PromotionModule } from '../promotion/promotion.module';
import { Product } from '../product/entities/product.entity';
import { MidtransModule } from '@ruraim/nestjs-midtrans';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, TransactionItem, Product]),
    ProductModule,
    PromotionModule,
    MidtransModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        clientKey: configService.get('MIDTRANS_CLIENT_KEY'),
        serverKey: configService.get('MIDTRANS_SERVER_KEY'),
        merchantId: configService.get('MIDTRANS_MERCHANT_ID'),
        sandbox: configService.get('MIDTRANS_SANDBOX') === 'true',
      }),
    }),
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService]
})
export class TransactionModule {}