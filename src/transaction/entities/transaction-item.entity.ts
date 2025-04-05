import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { Transaction } from './transaction.entity';

@Entity()
export class TransactionItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  transactionId: number;

  @ManyToOne(() => Transaction, transaction => transaction.items)
  @JoinColumn({ name: 'transactionId' })
  transaction: Transaction;

  @Column()
  productId: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  productPrice: number;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}