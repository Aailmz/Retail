import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { Product } from './product/entities/product.entity';
import { Category } from './category/entities/category.entity';
import { Member } from './member/entities/member.entity';
import { MemberModule } from './member/member.module';
import { PromotionModule } from './promotion/promotion.module';
import { Promotion } from './promotion/entities/promotion.entity';
import { TransactionModule } from './transaction/transaction.module';
import { Transaction } from './transaction/entities/transaction.entity';
import { TransactionItem } from './transaction/entities/transaction-item.entity';
import { InvoiceModule } from './invoice/invoice.module';
import { MidtransModule } from '@ruraim/nestjs-midtrans';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Agar config dapat diakses di semua modul
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Product, Category, Member, Promotion, Transaction, TransactionItem],
        synchronize: true, // Perhatian: Jangan gunakan 'true' di production
      }),
    }),
    AuthModule,
    UsersModule,
    ProductModule,
    CategoryModule,
    MemberModule,
    PromotionModule,
    TransactionModule,
    InvoiceModule,
    MidtransModule.register({
      clientKey: 'client-key',
      serverKey: 'server-key',
      merchantId: 'merchant-id',
      sandbox: true, // default: false
      isGlobal: true // default: false
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}