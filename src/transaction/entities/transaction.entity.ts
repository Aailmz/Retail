import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Member } from '../../member/entities/member.entity';
import { TransactionItem } from './transaction-item.entity';

export enum PaymentMethod {
  CASH = 'cash',
  QRIS = 'qris',
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  transactionCode: string;

  @Column({ nullable: true })
  memberId: number;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  markedUpPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0, nullable: true })
  markupPercentage: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
  discountAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  total: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  grandTotal: number;

  @Column({ nullable: true })
  note: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true })
  promotionId: number;

  @OneToMany(() => TransactionItem, item => item.transaction, { cascade: true })
  items: TransactionItem[];

  @Column({ default: false })
  isVoided: boolean;

  @Column({ nullable: true })
  voidReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  midtransOrderId: string;

  @Column({ type: 'text', nullable: true })
  qrisImageUrl: string;
}