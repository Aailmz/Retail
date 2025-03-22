import { Module } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { PromotionController } from './promotion.controller';

@Module({
  providers: [PromotionService],
  controllers: [PromotionController]
})
export class PromotionModule {}
