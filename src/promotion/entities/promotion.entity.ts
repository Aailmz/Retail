import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('enum', { enum: ['buy_x_get_y', 'discount_percentage', 'bundle'] })
  promotionType: string;

  @Column('datetime')
  startDate: Date;

  @Column('datetime')
  endDate: Date;

  @Column('enum', { enum: ['active', 'inactive', 'scheduled', 'expired'], default: 'active' })
  status: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  markupPercentage: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  targetMargin: number;

  @Column('json', { nullable: true })
  rules: any;

  @Column('json', { nullable: true })
  configuration: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}