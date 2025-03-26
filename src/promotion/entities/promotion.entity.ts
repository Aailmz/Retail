import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
  
  @Column()
  type: string;
  
  @Column({ nullable: true })
  description: string;
  
  @Column()
  status: string;
  
  @Column()
  startDate: Date;
  
  @Column()
  endDate: Date;
  
  @Column('simple-json')
  rules: {
    eligible_products: number[];
    min_purchase?: number;
    member_only?: boolean;
    max_usage?: number;
    voucher_code?: string;
  };
  
  @Column('simple-json')
  configuration: any;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}