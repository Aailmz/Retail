import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Raw } from 'typeorm';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Promotion } from './entities/promotion.entity';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    const promotion = this.promotionRepository.create(createPromotionDto);
    return this.promotionRepository.save(promotion);
  }

  async findAll(): Promise<Promotion[]> {
    return this.promotionRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Promotion> {
    return this.promotionRepository.findOneBy({ id });
  }

  async update(id: number, updatePromotionDto: UpdatePromotionDto): Promise<Promotion> {
    await this.promotionRepository.update(id, updatePromotionDto);
    return this.promotionRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.promotionRepository.delete(id);
  }
  
  async calculateMarkup(discountRate: number): Promise<number> {
    if (discountRate < 0 || discountRate >= 100) {
      throw new Error('Discount rate must be between 0 and 100');
    }
    
    const markup = (discountRate / (100 - discountRate)) * 100;
    return markup;
  }
  async findActive(): Promise<Promotion[]> {
    const today = new Date();
    return this.promotionRepository.find({
      where: {
        status: 'active',
        startDate: LessThanOrEqual(today),
        endDate: MoreThanOrEqual(today)
      }
    });
  }

  async findByVoucherCode(code: string): Promise<Promotion> {
    const today = new Date();
    const promotion = await this.promotionRepository.findOne({
      where: {
        status: 'active',
        startDate: LessThanOrEqual(today),
        endDate: MoreThanOrEqual(today),
        rules: Raw(rules => `${rules}->>'voucher_code' = :code`, { code })
      }
    });
    
    if (!promotion) {
      throw new NotFoundException(`Promotion with voucher code ${code} not found`);
    }
    
    return promotion;
  }
}