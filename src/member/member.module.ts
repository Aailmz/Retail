import { Module } from '@nestjs/common';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';

@Module({
  providers: [MemberService],
  controllers: [MemberController]
})
export class MemberModule {}
