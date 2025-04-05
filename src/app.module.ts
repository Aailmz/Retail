import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'discount_ukk',
      entities: [User, Product, Category, Member, Promotion, Transaction, TransactionItem],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ProductModule,
    CategoryModule,
    MemberModule,
    PromotionModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}